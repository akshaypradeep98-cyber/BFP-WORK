import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createRequestClient } from "@/lib/supabase/server";
import { level2CheckerError } from "@/lib/checkers";


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createRequestClient();
    const { id } = await params;

    const { data: check, error } = await supabase
      .from("task_checks")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !check) {
      return NextResponse.json(
        { error: "Check not found" },
        { status: 404 }
      );
    }

    // Get task, client, worker info
    const { data: task } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", check.task_id)
      .single();

    const { data: client } = await supabase
      .from("clients")
      .select("*")
      .eq("id", task?.client_id)
      .single();

    const { data: worker } = await supabase
      .from("employees")
      .select("*")
      .eq("id", task?.employee_id)
      .single();

    const { data: checker } = await supabase
      .from("employees")
      .select("*")
      .eq("id", check.checker_id)
      .single();

    // Latest approved Level 1 check: earlier rounds may also be approved
    // if Level 2 sent the task back and it went through Level 1 again.
    const { data: level1Check } = await supabase
      .from("task_checks")
      .select("*")
      .eq("task_id", check.task_id)
      .eq("check_level", 1)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let level1Checker = null;
    if (level1Check) {
      const { data: l1c } = await supabase
        .from("employees")
        .select("*")
        .eq("id", level1Check.checker_id)
        .single();
      level1Checker = l1c;
    }

    return NextResponse.json({
      ...check,
      task: {
        ...task,
        client,
        employee: worker,
      },
      checker,
      level1Check: level1Check ? { ...level1Check, checker: level1Checker } : null,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch check" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createRequestClient();
    const { id } = await params;
    const { action, notes, new_checker_id, resend_level } = await request.json();

    if (action === "approve") {
      const { data: check } = await supabase
        .from("task_checks")
        .select("*")
        .eq("id", id)
        .single();

      // Update check
      await supabase
        .from("task_checks")
        .update({ status: "approved", notes, approved_at: new Date().toISOString() })
        .eq("id", id);

      // Mark task as approved. A Level 2 checker who isn't admin/manager
      // or the task's own assignee can't pass tasks_update RLS (and the
      // enforce_task_update_scope trigger) — see the matching note in
      // /api/checks/level1/[id] — so this goes through the admin client.
      const { error: taskError } = await createAdminClient()
        .from("tasks")
        .update({ check_status: "approved", status: "done" })
        .eq("id", check.task_id);

      if (taskError) {
        // Undo the check change so the check and the task never disagree.
        console.error("Task stage update failed:", taskError);
        await supabase
          .from("task_checks")
          .update({ status: "in_progress", approved_at: null })
          .eq("id", id);
        return NextResponse.json({ error: `Couldn't update the task: ${taskError.message}` }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === "reject") {
      const { data: check } = await supabase
        .from("task_checks")
        .select("*")
        .eq("id", id)
        .single();

      if (resend_level !== undefined && resend_level !== 1 && resend_level !== 2) {
        return NextResponse.json({ error: "resend_level must be 1 or 2" }, { status: 400 });
      }

      const { error: rejectError } = await supabase
        .from("task_checks")
        .update({ status: "rejected", notes, resend_level: resend_level ?? 1 })
        .eq("id", id);

      if (rejectError) {
        return NextResponse.json({ error: rejectError.message }, { status: 500 });
      }

      // Same RLS/trigger gap as the approve path above.
      const { error: taskError } = await createAdminClient()
        .from("tasks")
        .update({ check_status: "rejected", status: "prog" })
        .eq("id", check.task_id);

      if (taskError) {
        // Undo the check change so the check and the task never disagree.
        console.error("Task stage update failed:", taskError);
        await supabase
          .from("task_checks")
          .update({ status: "in_progress", approved_at: null })
          .eq("id", id);
        return NextResponse.json({ error: `Couldn't update the task: ${taskError.message}` }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === "reassign") {
      const { data: check } = await supabase
        .from("task_checks")
        .select("*")
        .eq("id", id)
        .single();

      if (!check) {
        return NextResponse.json({ error: "Check not found" }, { status: 404 });
      }

      const checkerError = await level2CheckerError(check.task_id, new_checker_id);
      if (checkerError) {
        return NextResponse.json({ error: checkerError }, { status: 400 });
      }

      await supabase
        .from("task_checks")
        .update({ status: "reassigned" })
        .eq("id", id);

      await supabase
        .from("task_checks")
        .insert([
          {
            task_id: check.task_id,
            checker_id: new_checker_id,
            check_level: 2,
            status: "in_progress",
          },
        ]);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to update check" },
      { status: 500 }
    );
  }
}
