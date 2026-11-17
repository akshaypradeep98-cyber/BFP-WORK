import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createRequestClient } from "@/lib/supabase/server";


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
    const { action, notes, new_checker_id } = await request.json();

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

      // Update check status
      await supabase
        .from("task_checks")
        .update({ status: "approved", notes })
        .eq("id", id);

      // Update task check_status
      await supabase
        .from("tasks")
        .update({ check_status: "checking_level2" })
        .eq("id", check.task_id);

      // Create Level 2 check. This routing lookup needs to see every
      // employee's classification regardless of who the caller is, so it
      // uses the admin client rather than the request-scoped one.
      const { data: manager } = await createAdminClient()
        .from("employees")
        .select("id")
        .in("classification", ["manager", "admin"])
        .order("classification", { ascending: false })
        .limit(1)
        .maybeSingle();

      await supabase
        .from("task_checks")
        .insert([
          {
            task_id: check.task_id,
            checker_id: manager?.id ?? check.checker_id,
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

      await supabase
        .from("tasks")
        .update({ check_status: "pending" })
        .eq("id", check.task_id);

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
