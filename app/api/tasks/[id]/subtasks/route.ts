import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// POST create subtask
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const taskId = parseInt(id);
    const body = await request.json();
    const { title } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Subtask title is required" },
        { status: 400 }
      );
    }

    // Get the highest sort_order for this task
    const { data: lastSubtask } = await supabase
      .from("subtasks")
      .select("sort_order")
      .eq("task_id", taskId)
      .order("sort_order", { ascending: false })
      .limit(1);

    const nextSortOrder =
      (lastSubtask && lastSubtask.length > 0
        ? lastSubtask[0].sort_order
        : -1) + 1;

    const { data, error } = await supabase
      .from("subtasks")
      .insert([
        {
          task_id: taskId,
          title,
          done: false,
          seconds: 0,
          sort_order: nextSortOrder,
        },
      ])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error("Error creating subtask:", error);
    return NextResponse.json(
      { error: "Failed to create subtask" },
      { status: 500 }
    );
  }
}
