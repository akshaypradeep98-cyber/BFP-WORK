import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSubtasksForTitle } from "@/lib/taskTemplates";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// GET all tasks (with optional employee_id filter)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employee_id");

    let query = supabase.from("tasks").select("*");

    // Filter by employee_id if provided
    if (employeeId) {
      query = query.eq("employee_id", parseInt(employeeId));
    }

    const { data, error } = await query.order("due_date");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
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
    const body = await request.json();
    const { title, client_id, employee_id, division_id, due_date, amount, tax_period, template_id, subtasks } =
      body;

    if (!title) {
      return NextResponse.json(
        { error: "Task title is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("tasks")
      .insert([
        {
          title,
          client_id: client_id || null,
          employee_id: employee_id || null,
          division_id: division_id || null,
          due_date: due_date || null,
          amount: amount || 0,
          tax_period: tax_period || "25-26",
          status: "todo",
          template_id: template_id || null,
        },
      ])
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
        text: st.text,
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
          text: st.text,
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
        text: st.title,
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
