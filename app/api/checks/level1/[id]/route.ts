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

    // Name-only lookups: the worker/checker may not be the caller or an
    // admin/manager, so these deliberately use the admin client rather
    // than the request-scoped one RLS would otherwise block them on.
    const admin = createAdminClient();
    const { data: worker } = await admin
      .from("employees")
      .select("id, name")
      .eq("id", task?.employee_id)
      .single();

    const { data: checker } = await admin
      .from("employees")
      .select("id, name")
      .eq("id", check.checker_id)
      .single();

    return NextResponse.json({
      ...check,
      task: {
        ...task,
        client,
        employee: worker,
      },
      checker,
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
    const { action, notes, new_checker_id, level2_checker_id } = await request.json();

    if (action === "save_notes") {
      const { error } = await supabase
        .from("task_checks")
        .update({ notes })
        .eq("id", id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === "approve") {
      // Get the check and task
      const { data: check } = await supabase
        .from("task_checks")
        .select("*")
        .eq("id", id)
        .single();

      if (!check) {
        return NextResponse.json({ error: "Check not found" }, { status: 404 });
      }

      const checkerError = await level2CheckerError(check.task_id, level2_checker_id, check.checker_id);
      if (checkerError) {
        return NextResponse.json({ error: checkerError }, { status: 400 });
      }

      // Update check status
      const { error: approveError } = await supabase
        .from("task_checks")
        .update({ status: "approved", notes, approved_at: new Date().toISOString() })
        .eq("id", id);
      if (approveError) {
        return NextResponse.json({ error: approveError.message }, { status: 500 });
      }

      // Update task check_status. A Level 1 checker who isn't
      // admin/manager or the task's own assignee can't pass tasks_update
      // RLS (and the enforce_task_update_scope trigger), so this goes
      // through the admin client like the manager lookup below — the
      // check-row read above is the real gate on who can call this.
      const checkAdmin = createAdminClient();
      const { error: taskError } = await checkAdmin
        .from("tasks")
        .update({ check_status: "checking_level2" })
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

      // Level 2 check goes to the checker the Level 1 checker picked.
      await supabase
        .from("task_checks")
        .insert([
          {
            task_id: check.task_id,
            checker_id: level2_checker_id,
            check_level: 2,
            status: "in_progress",
          },
        ]);

      return NextResponse.json({ success: true });
    }

    if (action === "reject") {
      const { data: check } = await supabase
        .from("task_checks")
        .select("*")
        .eq("id", id)
        .single();

      await supabase
        .from("task_checks")
        .update({ status: "rejected", notes })
        .eq("id", id);

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
            check_level: 1,
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
