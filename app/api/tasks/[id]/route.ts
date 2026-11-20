import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createRequestClient } from "@/lib/supabase/server";
import { checklistLockedResponse } from "@/lib/checklistLock";
import { level2CheckerError } from "@/lib/checkers";
import { canCompleteTask } from "@/lib/utils";
import { getSubtasksForTitle } from "@/lib/taskTemplates";


// GET task with subtasks
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createRequestClient();
    const { id } = await params;
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    const { data: subtasks, error: subtasksError } = await supabase
      .from("subtasks")
      .select("*")
      .eq("task_id", id)
      .order("sort_order");

    if (subtasksError) {
      return NextResponse.json(
        { error: subtasksError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...task,
      subtasks: subtasks || [],
    });
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

// PUT update task (status, employee_id, amount, expense, tax_period, check_status, checker_id)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createRequestClient();
    const { id } = await params;
    const body = await request.json();
    const { status, employee_id, amount, expense, tax_period, check_status, checker_id } = body;

    // A task can be closed only after Level 2 approval with every step done.
    if (status === "completed") {
      const admin = createAdminClient();
      const [{ data: current }, { data: steps }] = await Promise.all([
        admin.from("tasks").select("check_status").eq("id", parseInt(id)).maybeSingle(),
        admin.from("subtasks").select("done").eq("task_id", parseInt(id)),
      ]);
      if (!canCompleteTask(current?.check_status, steps)) {
        return NextResponse.json(
          { error: "A task can be completed only after Level 2 approval, with every step ticked." },
          { status: 400 }
        );
      }
    }

    // A resend may skip Level 1 only when the Level 2 checker who sent it
    // back chose that.
    if (check_status === "checking_level2") {
      const { data: lastRejection } = await createAdminClient()
        .from("task_checks")
        .select("check_level, resend_level")
        .eq("task_id", parseInt(id))
        .eq("status", "rejected")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastRejection?.check_level !== 2 || lastRejection?.resend_level !== 2) {
        return NextResponse.json(
          { error: "This task has to go through a Level 1 check first." },
          { status: 400 }
        );
      }
      const checkerError = await level2CheckerError(parseInt(id), checker_id);
      if (checkerError) {
        return NextResponse.json({ error: checkerError }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (employee_id) updateData.employee_id = employee_id;
    if (amount !== undefined) updateData.amount = amount;
    if (expense !== undefined) updateData.expense = expense;
    if (tax_period) updateData.tax_period = tax_period;
    if (check_status) updateData.check_status = check_status;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If assigning a checker, create task_check record
    if ((check_status === "checking_level1" || check_status === "checking_level2") && checker_id) {
      const { error: checkError } = await supabase
        .from("task_checks")
        .insert([
          {
            task_id: parseInt(id),
            checker_id,
            check_level: check_status === "checking_level2" ? 2 : 1,
            status: "in_progress",
          },
        ]);

      if (checkError) {
        console.error("Error creating task check:", checkError);
        // Don't fail the request, just log it
      }
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// POST generate subtasks from template
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createRequestClient();
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (action === "generate-checklist") {
      const locked = await checklistLockedResponse(parseInt(id));
      if (locked) return locked;

      // Get the task to read its title
      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .select("title")
        .eq("id", id)
        .single();

      if (taskError || !task) {
        console.error("Task not found error:", taskError);
        return NextResponse.json(
          { error: "Task not found" },
          { status: 404 }
        );
      }

      // Get template based on title
      const template = getSubtasksForTitle(task.title);

      // Insert subtasks
      const subtasksData = template.map((st) => ({
        task_id: parseInt(id),
        title: st.title,
        done: false,
        seconds: 0,
        sort_order: st.sortOrder,
      }));

      const { data, error } = await supabase
        .from("subtasks")
        .insert(subtasksData)
        .select();

      if (error) {
        console.error("Insert error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, subtasks: data });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error generating checklist:", error);
    return NextResponse.json(
      { error: `Failed to generate checklist: ${error}` },
      { status: 500 }
    );
  }
}

// DELETE task (subtasks, checks and payments cascade in the database)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createRequestClient();
    const { id } = await params;

    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
