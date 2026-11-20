import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checklistLockedResponse } from "@/lib/checklistLock";
import { createAdminClient } from "@/lib/supabase/server";

// Time is credited to the task's assignee. A failed log write is reported
// in the server log but doesn't undo the step's saved time.
async function logTimeEntry(taskId: number, subtaskId: number, deltaSeconds: number) {
  const admin = createAdminClient();
  const { data: task } = await admin.from("tasks").select("employee_id").eq("id", taskId).maybeSingle();
  const { error } = await admin.from("time_entries").insert({
    task_id: taskId,
    subtask_id: subtaskId,
    employee_id: task?.employee_id ?? null,
    seconds: deltaSeconds,
  });
  if (error) console.error("Couldn't record time entry:", error.message);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// PUT update subtask
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  try {
    const { id, subtaskId } = await params;
    const locked = await checklistLockedResponse(parseInt(id), parseInt(subtaskId));
    if (locked) return locked;
    const body = await request.json();
    const { done, seconds, notes } = body;

    // Time before the change, so the dated time log records the difference
    let previousSeconds = 0;
    if (seconds !== undefined) {
      const { data: before } = await supabase
        .from("subtasks")
        .select("seconds")
        .eq("id", parseInt(subtaskId))
        .maybeSingle();
      previousSeconds = before?.seconds || 0;
    }

    const updateData: any = {};
    if (done !== undefined) updateData.done = done;
    if (seconds !== undefined) {
      updateData.seconds = seconds;
      updateData.last_logged = new Date().toISOString();
    }
    if (notes !== undefined) updateData.notes = notes;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("subtasks")
      .update(updateData)
      .eq("id", parseInt(subtaskId))
      .eq("task_id", parseInt(id))
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Subtask not found" },
        { status: 404 }
      );
    }

    if (seconds !== undefined && seconds !== previousSeconds) {
      await logTimeEntry(parseInt(id), parseInt(subtaskId), seconds - previousSeconds);
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("Error updating subtask:", error);
    return NextResponse.json(
      { error: "Failed to update subtask" },
      { status: 500 }
    );
  }
}

// DELETE subtask
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  try {
    const { id, subtaskId } = await params;
    const locked = await checklistLockedResponse(parseInt(id));
    if (locked) return locked;
    const { error } = await supabase
      .from("subtasks")
      .delete()
      .eq("id", parseInt(subtaskId))
      .eq("task_id", parseInt(id));

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting subtask:", error);
    return NextResponse.json(
      { error: "Failed to delete subtask" },
      { status: 500 }
    );
  }
}
