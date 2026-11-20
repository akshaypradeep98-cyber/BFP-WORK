import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { effectiveCheckStatus, isChecklistLocked } from "@/lib/utils";

export const CHECKLIST_LOCKED_MESSAGE =
  "This task is with a checker, so its checklist is locked. It can be edited again if it's sent back.";
const APPROVED_STEP_LOCKED_MESSAGE =
  "This step was verified in the Level 1 check, so it can't be changed after approval.";
const COMPLETED_MESSAGE = "This task is completed and can no longer be changed.";

// Subtasks the latest approved Level 1 check verified. After Level 2
// approval these stay frozen; any other step (work that happens after the
// check) can still be ticked, timed and noted.
export async function getVerifiedSubtaskIds(taskId: number): Promise<Set<number>> {
  const admin = createAdminClient();
  const { data: l1 } = await admin
    .from("task_checks")
    .select("id")
    .eq("task_id", taskId)
    .eq("check_level", 1)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!l1) return new Set();

  const { data: rows } = await admin
    .from("subtask_verifications")
    .select("subtask_id")
    .eq("check_id", l1.id)
    .eq("verified", true);
  return new Set((rows || []).map((r) => r.subtask_id));
}

// Returns an error response when the change isn't allowed, otherwise null.
// Pass subtaskId for an edit to one existing step; omit it for adding,
// generating or other whole-checklist changes. Uses the admin client
// because the subtask routes have no user session and RLS on tasks would
// otherwise hide the row.
export async function checklistLockedResponse(taskId: number, subtaskId?: number) {
  const admin = createAdminClient();
  const [{ data: task }, { data: checks }] = await Promise.all([
    admin.from("tasks").select("status, check_status").eq("id", taskId).maybeSingle(),
    admin
      .from("task_checks")
      .select("status")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true }),
  ]);

  if (task?.status === "completed") {
    return NextResponse.json({ error: COMPLETED_MESSAGE }, { status: 423 });
  }

  const status = effectiveCheckStatus(task?.check_status, checks || []);
  if (!isChecklistLocked(status)) return null;

  if (status === "approved" && subtaskId !== undefined) {
    const verified = await getVerifiedSubtaskIds(taskId);
    if (!verified.has(subtaskId)) return null;
    return NextResponse.json({ error: APPROVED_STEP_LOCKED_MESSAGE }, { status: 423 });
  }

  return NextResponse.json({ error: CHECKLIST_LOCKED_MESSAGE }, { status: 423 });
}
