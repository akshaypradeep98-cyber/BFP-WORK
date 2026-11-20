import { createAdminClient } from "@/lib/supabase/server";

const REVIEWER_ROLES = ["manager", "admin"];

// Level 2 checks happen on a manager-only page, and the person who did the
// Level 1 check can't also do Level 2. Returns an error message, or null
// when the checker is allowed.
export async function level2CheckerError(
  taskId: number,
  checkerId: number | null | undefined,
  level1CheckerId?: number
): Promise<string | null> {
  if (!checkerId) return "Pick a Level 2 checker.";

  const admin = createAdminClient();
  const { data: checker } = await admin
    .from("employees")
    .select("classification")
    .eq("id", checkerId)
    .maybeSingle();

  if (!checker || !REVIEWER_ROLES.includes(checker.classification)) {
    return "The Level 2 checker must be a manager or admin.";
  }

  let l1CheckerId = level1CheckerId;
  if (l1CheckerId === undefined) {
    const { data: lastL1 } = await admin
      .from("task_checks")
      .select("checker_id")
      .eq("task_id", taskId)
      .eq("check_level", 1)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    l1CheckerId = lastL1?.checker_id;
  }

  if (l1CheckerId === checkerId) {
    return "The person who did the Level 1 check can't also do the Level 2 check.";
  }

  return null;
}
