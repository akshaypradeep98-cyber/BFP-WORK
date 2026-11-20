import { NextRequest, NextResponse } from "next/server";
import { createRequestClient } from "@/lib/supabase/server";
import { getSubtasksForTitle } from "@/lib/taskTemplates";
import { getTaxPeriods } from "@/lib/utils";


// GET all tasks (with optional employee_id filter)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRequestClient();
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employee_id");

    let query = supabase.from("tasks").select("*, subtasks(seconds)");

    // Filter by employee_id if provided
    if (employeeId) {
      query = query.eq("employee_id", parseInt(employeeId));
    }

    const { data, error } = await query.order("due_date");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const withTotals = (data || []).map(({ subtasks, ...task }) => ({
      ...task,
      total_seconds: (subtasks || []).reduce(
        (sum: number, s: { seconds: number | null }) => sum + (s.seconds || 0),
        0
      ),
    }));

    return NextResponse.json(withTotals);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST create new task
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRequestClient();
    const body = await request.json();
    const { title, client_id, employee_id, division_id, due_date, amount, tax_period, template_id, subtasks } =
      body;

    if (!title) {
      return NextResponse.json(
        { error: "Task title is required" },
        { status: 400 }
      );
    }

    const insertData: any = {
      title,
      client_id: client_id || null,
      employee_id: employee_id || null,
      division_id: division_id || null,
      due_date: due_date || null,
      amount: amount || 0,
      tax_period: tax_period || getTaxPeriods(0, 0)[0],
      status: "todo",
    };

    // Only include template_id if column exists in database
    if (template_id) {
      insertData.template_id = template_id;
    }

    const { data, error } = await supabase
      .from("tasks")
      .insert([insertData])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const taskId = data[0].id;
    let subtasksData: any[] = [];

    // If subtasks array provided from modal preview, use those
    if (subtasks && Array.isArray(subtasks) && subtasks.length > 0) {
      subtasksData = subtasks.map((st: any) => ({
        task_id: taskId,
        title: st.text ?? st.title,
        done: false,
        seconds: 0,
        notes: null,
        sort_order: st.sort_order,
      }));
    }
    // Otherwise if template_id provided, fetch from template
    else if (template_id) {
      const { data: templateSubtasks, error: templateError } = await supabase
        .from("template_subtasks")
        .select("*")
        .eq("template_id", template_id)
        .order("sort_order", { ascending: true });

      if (templateError) {
        console.error("Error fetching template subtasks:", templateError);
      } else if (templateSubtasks && templateSubtasks.length > 0) {
        subtasksData = templateSubtasks.map((st) => ({
          task_id: taskId,
          title: st.text ?? st.title,
          done: false,
          seconds: 0,
          notes: st.notes || null,
          sort_order: st.sort_order,
        }));
      }
    } else {
      // Fall back to auto-generate based on title
      const template = getSubtasksForTitle(title);
      subtasksData = template.map((st) => ({
        task_id: taskId,
        title: st.title,
        done: false,
        seconds: 0,
        sort_order: st.sortOrder,
      }));
    }

    // Insert subtasks if any
    if (subtasksData.length > 0) {
      const { error: subtaskError } = await supabase
        .from("subtasks")
        .insert(subtasksData);

      if (subtaskError) {
        console.error("Error creating subtasks:", subtaskError);
      }
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
