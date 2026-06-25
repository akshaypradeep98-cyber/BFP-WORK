import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSubtasksForTitle } from "@/lib/taskTemplates";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// GET all tasks
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("due_date");

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
    const { title, client_id, employee_id, division_id, due_date, amount, tax_period } =
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
        },
      ])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const taskId = data[0].id;

    // Auto-generate subtasks based on title
    const template = getSubtasksForTitle(title);
    const subtasksData = template.map((st) => ({
      task_id: taskId,
      title: st.title,
      done: false,
      seconds: 0,
      sort_order: st.sortOrder,
    }));

    const { error: subtaskError } = await supabase
      .from("subtasks")
      .insert(subtasksData);

    if (subtaskError) {
      console.error("Error creating subtasks:", subtaskError);
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
