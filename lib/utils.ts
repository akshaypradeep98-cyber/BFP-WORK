// Utility functions for the app

export const AVATAR_COLORS = ["#2a5d8f", "#1f7a52", "#c87a23", "#7a4fa0", "#b3392f"];

export const CLASSIFICATIONS = [
  "admin",
  "manager",
  "article",
  "staff",
];

// Where a task is in the checking workflow (tasks.check_status).
// "pending" (never sent for checking) has no badge.
export const CHECK_STAGES: Record<string, { label: string; className: string }> = {
  waiting_for_checker: { label: "Awaiting checker", className: "bg-amber-100 text-amber-800" },
  checking_level1: { label: "Level 1 check", className: "bg-blue-100 text-blue-800" },
  checking_level2: { label: "Level 2 check", className: "bg-purple-100 text-purple-800" },
  approved: { label: "Approved", className: "bg-green-100 text-green-800" },
  rejected: { label: "Sent back", className: "bg-red-100 text-red-800" },
};

// Outcome of a single check round (task_checks.status).
export const CHECK_RESULTS: Record<string, { label: string; className: string }> = {
  in_progress: { label: "In progress", className: "bg-blue-100 text-blue-800" },
  approved: { label: "Approved", className: "bg-green-100 text-green-800" },
  rejected: { label: "Sent back", className: "bg-red-100 text-red-800" },
  reassigned: { label: "Reassigned", className: "bg-gray-100 text-gray-700" },
};

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getRandomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

export function formatDate(date: string | Date | null): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

// Indian financial year runs April-March. Returns "YY-YY+1" labels
// spanning `yearsBefore`/`yearsAfter` years around the current FY, so
// the list stays correct as years pass instead of a frozen hardcoded set.
export function getTaxPeriods(yearsBefore: number = 10, yearsAfter: number = 10): string[] {
  const now = new Date();
  const currentFyStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;

  const periods: string[] = [];
  for (let offset = yearsAfter; offset >= -yearsBefore; offset--) {
    const startYear = currentFyStart + offset;
    const label = `${String(startYear % 100).padStart(2, "0")}-${String((startYear + 1) % 100).padStart(2, "0")}`;
    periods.push(label);
  }
  return periods;
}

type CheckRound = { status: string };

// Tasks rejected before the reject fix kept a stale "checking_*" status.
// Trust the check history: an active stage with no open check whose
// latest round was rejected is really a send-back.
export function effectiveCheckStatus(
  checkStatus: string | null | undefined,
  checks: CheckRound[]
): string | null | undefined {
  const latest = checks[checks.length - 1];
  const hasOpenCheck = checks.some((c) => c.status === "in_progress");
  if (checkStatus?.startsWith("checking_") && !hasOpenCheck && latest?.status === "rejected") {
    return "rejected";
  }
  return checkStatus;
}

// Once a task is sent for checking its checklist is frozen; it opens up
// again only when a checker sends it back.
const LOCKED_CHECK_STATUSES = ["waiting_for_checker", "checking_level1", "checking_level2", "approved"];

export function isChecklistLocked(checkStatus: string | null | undefined): boolean {
  return LOCKED_CHECK_STATUSES.includes(checkStatus || "");
}

// "done" = work submitted for checking; "completed" = approved at Level 2,
// every step finished, and closed by the staff member. Neither counts as
// open work.
export function isTaskOpen(status: string | null | undefined): boolean {
  return status !== "done" && status !== "completed";
}

export function canCompleteTask(
  checkStatus: string | null | undefined,
  subtasks: { done: boolean }[] | null | undefined
): boolean {
  return checkStatus === "approved" && !!subtasks?.length && subtasks.every((s) => s.done);
}
