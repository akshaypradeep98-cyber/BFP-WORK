// Task subtask templates based on keywords in task title

export interface SubtaskTemplate {
  title: string;
  sortOrder: number;
}

const TEMPLATES: Record<string, SubtaskTemplate[]> = {
  gst: [
    { title: "Collect sales and purchase registers", sortOrder: 0 },
    { title: "Reconcile GSTR-2B with books", sortOrder: 1 },
    { title: "Prepare GSTR-1", sortOrder: 2 },
    { title: "Match input tax credit", sortOrder: 3 },
    { title: "Compute tax liability", sortOrder: 4 },
    { title: "Make tax payment", sortOrder: 5 },
    { title: "File GSTR-3B", sortOrder: 6 },
    { title: "Share filing acknowledgement", sortOrder: 7 },
  ],
  "income tax": [
    { title: "Collect Form 16, 26AS, AIS", sortOrder: 0 },
    { title: "Reconcile income sources", sortOrder: 1 },
    { title: "Compute total income and tax", sortOrder: 2 },
    { title: "Select correct ITR form", sortOrder: 3 },
    { title: "Pay self-assessment tax", sortOrder: 4 },
    { title: "File the return", sortOrder: 5 },
    { title: "E-verify", sortOrder: 6 },
    { title: "Share ITR-V", sortOrder: 7 },
  ],
  itr: [
    { title: "Collect Form 16, 26AS, AIS", sortOrder: 0 },
    { title: "Reconcile income sources", sortOrder: 1 },
    { title: "Compute total income and tax", sortOrder: 2 },
    { title: "Select correct ITR form", sortOrder: 3 },
    { title: "Pay self-assessment tax", sortOrder: 4 },
    { title: "File the return", sortOrder: 5 },
    { title: "E-verify", sortOrder: 6 },
    { title: "Share ITR-V", sortOrder: 7 },
  ],
  audit: [
    { title: "Send engagement letter", sortOrder: 0 },
    { title: "Obtain trial balance", sortOrder: 1 },
    { title: "Vouch transactions", sortOrder: 2 },
    { title: "Check statutory compliance", sortOrder: 3 },
    { title: "Prepare financial statements", sortOrder: 4 },
    { title: "Compile working papers", sortOrder: 5 },
    { title: "Draft audit report", sortOrder: 6 },
    { title: "Partner review", sortOrder: 7 },
    { title: "File signed report", sortOrder: 8 },
  ],
  roc: [
    { title: "Collect financials", sortOrder: 0 },
    { title: "Verify DIN/DIR-3 KYC", sortOrder: 1 },
    { title: "Prepare AOC-4", sortOrder: 2 },
    { title: "Prepare MGT-7", sortOrder: 3 },
    { title: "Obtain board resolution", sortOrder: 4 },
    { title: "File AOC-4", sortOrder: 5 },
    { title: "File MGT-7", sortOrder: 6 },
    { title: "Save challans", sortOrder: 7 },
  ],
  "annual filing": [
    { title: "Collect financials", sortOrder: 0 },
    { title: "Verify DIN/DIR-3 KYC", sortOrder: 1 },
    { title: "Prepare AOC-4", sortOrder: 2 },
    { title: "Prepare MGT-7", sortOrder: 3 },
    { title: "Obtain board resolution", sortOrder: 4 },
    { title: "File AOC-4", sortOrder: 5 },
    { title: "File MGT-7", sortOrder: 6 },
    { title: "Save challans", sortOrder: 7 },
  ],
  tds: [
    { title: "Collect deduction details", sortOrder: 0 },
    { title: "Validate PANs", sortOrder: 1 },
    { title: "Prepare TDS return (24Q/26Q/27Q)", sortOrder: 2 },
    { title: "Validate with FVU", sortOrder: 3 },
    { title: "File return", sortOrder: 4 },
    { title: "Generate Form 16/16A", sortOrder: 5 },
    { title: "Share certificates", sortOrder: 6 },
  ],
  "books": [
    { title: "Collect vouchers and statements", sortOrder: 0 },
    { title: "Post journal entries", sortOrder: 1 },
    { title: "Bank reconciliation", sortOrder: 2 },
    { title: "Prepare trial balance", sortOrder: 3 },
    { title: "Prepare P&L and Balance Sheet", sortOrder: 4 },
    { title: "Partner review", sortOrder: 5 },
  ],
  finalisation: [
    { title: "Collect vouchers and statements", sortOrder: 0 },
    { title: "Post journal entries", sortOrder: 1 },
    { title: "Bank reconciliation", sortOrder: 2 },
    { title: "Prepare trial balance", sortOrder: 3 },
    { title: "Prepare P&L and Balance Sheet", sortOrder: 4 },
    { title: "Partner review", sortOrder: 5 },
  ],
};

const DEFAULT_TEMPLATE: SubtaskTemplate[] = [
  { title: "Gather documents", sortOrder: 0 },
  { title: "Initial review", sortOrder: 1 },
  { title: "Prepare working", sortOrder: 2 },
  { title: "Internal review", sortOrder: 3 },
  { title: "Finalise and submit", sortOrder: 4 },
];

export function getSubtasksForTitle(title: string): SubtaskTemplate[] {
  const titleLower = title.toLowerCase();

  // Check for matches in order of specificity
  for (const [keyword, template] of Object.entries(TEMPLATES)) {
    if (titleLower.includes(keyword)) {
      return template;
    }
  }

  return DEFAULT_TEMPLATE;
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function formatTimerDisplay(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function getTotalTimeSeconds(subtasks: any[]): number {
  if (!subtasks || !Array.isArray(subtasks)) return 0;
  return subtasks.reduce((total, subtask) => total + (subtask?.seconds || 0), 0);
}
