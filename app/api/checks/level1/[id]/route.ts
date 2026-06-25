import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    const { id } = await params;
    const { action, notes, new_checker_id } = await request.json();

    if (action === "save_notes") {
      const { error } = await supabase
        .from("task_checks")
        .update({ notes, updated_at: new Date().toISOString() })
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
        .update({ status: "approved", notes, updated_at: new Date().toISOString() })
        .eq("id", id);

      // Update task check_status
      await supabase
        .from("tasks")
        .update({ check_status: "checking_level2" })
        .eq("id", check.task_id);

      // Create Level 2 check
      await supabase
        .from("task_checks")
        .insert([
          {
            task_id: check.task_id,
            checker_id: 1, // Will be assigned by manager
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
        .update({ status: "rejected", notes, updated_at: new Date().toISOString() })
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
