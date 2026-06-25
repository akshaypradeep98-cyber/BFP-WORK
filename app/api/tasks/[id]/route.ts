import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSubtasksForTitle } from "@/lib/taskTemplates";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// GET task with subtasks
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    const { id } = await params;
    const body = await request.json();
    const { status, employee_id, amount, expense, tax_period, check_status, checker_id } = body;

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
    if (check_status === "checking_level1" && checker_id) {
      const { error: checkError } = await supabase
        .from("task_checks")
        .insert([
          {
            task_id: parseInt(id),
            checker_id,
            check_level: 1,
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
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (action === "generate-checklist") {
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
