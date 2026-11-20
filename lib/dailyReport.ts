// Daily work report: one row per person, per day, per task they logged time
// on or received fees for. Days are Indian calendar days.

export const REPORT_TIMEZONE = "Asia/Kolkata";

export interface AttendanceRow {
  employee_id: number;
  login_at: string;
  logout_at: string | null;
}

export interface TimeEntryRow {
  task_id: number;
  employee_id: number | null;
  seconds: number;
  logged_at: string;
}

export interface PaymentRow {
  task_id: number;
  amount: number;
  payment_date: string; // YYYY-MM-DD
}

export interface ReportTask {
  id: number;
  title: string;
  client_id: number | null;
  employee_id: number | null;
  status: string;
  amount: number | null;
}

export interface DailyReportRow {
  date: string; // YYYY-MM-DD
  employeeId: number;
  staffName: string;
  loginTime: string; // HH:MM, "" if none
  logoutTime: string; // HH:MM, "" if not logged out
  taskId: number | null;
  taskTitle: string;
  clientName: string;
  seconds: number;
  status: string;
  feesReceived: number;
  paymentType: "Full" | "Partial" | "";
}

// Postgres TIMESTAMP (no zone) values come back without an offset but are
// stored in UTC.
export function parseUtc(value: string): Date {
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : `${value}Z`);
}

export function localDate(value: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: REPORT_TIMEZONE }).format(parseUtc(value));
}

export function localTime(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: REPORT_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(parseUtc(value));
}

// UTC instant at which an Indian calendar day starts (IST is UTC+5:30).
export function dayStartUtc(date: string): string {
  return new Date(Date.parse(`${date}T00:00:00+05:30`)).toISOString();
}

interface BuildInput {
  attendance: AttendanceRow[];
  entries: TimeEntryRow[];
  payments: PaymentRow[]; // payments in the range
  allPaymentsForTasks: PaymentRow[]; // every payment for the tasks involved, for Full/Partial
  tasks: ReportTask[];
  employees: { id: number; name: string }[];
  clients: { id: number; name: string }[];
}

interface StaffDay {
  date: string;
  employeeId: number;
  logins: string[];
  logouts: (string | null)[];
  tasks: Map<number, { seconds: number; fees: number }>;
}

export function buildDailyReport(input: BuildInput): DailyReportRow[] {
  const days = new Map<string, StaffDay>();
  const dayFor = (date: string, employeeId: number) => {
    const key = `${date}|${employeeId}`;
    let day = days.get(key);
    if (!day) {
      day = { date, employeeId, logins: [], logouts: [], tasks: new Map() };
      days.set(key, day);
    }
    return day;
  };
  const taskOf = (day: StaffDay, taskId: number) => {
    let t = day.tasks.get(taskId);
    if (!t) {
      t = { seconds: 0, fees: 0 };
      day.tasks.set(taskId, t);
    }
    return t;
  };

  for (const a of input.attendance) {
    const day = dayFor(localDate(a.login_at), a.employee_id);
    day.logins.push(a.login_at);
    day.logouts.push(a.logout_at);
  }

  const taskById = new Map(input.tasks.map((t) => [t.id, t]));

  for (const e of input.entries) {
    const employeeId = e.employee_id ?? taskById.get(e.task_id)?.employee_id;
    if (!employeeId) continue;
    taskOf(dayFor(localDate(e.logged_at), employeeId), e.task_id).seconds += e.seconds;
  }

  for (const p of input.payments) {
    const employeeId = taskById.get(p.task_id)?.employee_id;
    if (!employeeId) continue;
    taskOf(dayFor(p.payment_date, employeeId), p.task_id).fees += p.amount;
  }

  const name = (list: { id: number; name: string }[], id: number | null | undefined) =>
    list.find((x) => x.id === id)?.name || "";

  const paidThrough = (taskId: number, date: string) =>
    input.allPaymentsForTasks
      .filter((p) => p.task_id === taskId && p.payment_date <= date)
      .reduce((sum, p) => sum + p.amount, 0);

  const rows: DailyReportRow[] = [];
  for (const day of days.values()) {
    const sortedLogins = [...day.logins].sort();
    const loginTime = sortedLogins.length ? localTime(sortedLogins[0]) : "";
    // Blank when any session that day was never logged out
    const stillIn = day.logouts.some((l) => !l);
    const lastLogout = day.logouts.filter((l): l is string => !!l).sort().pop();
    const logoutTime = !stillIn && lastLogout ? localTime(lastLogout) : "";
    const base = {
      date: day.date,
      employeeId: day.employeeId,
      staffName: name(input.employees, day.employeeId) || "Unknown",
      loginTime,
      logoutTime,
    };

    if (day.tasks.size === 0) {
      rows.push({
        ...base,
        taskId: null,
        taskTitle: "",
        clientName: "",
        seconds: 0,
        status: "",
        feesReceived: 0,
        paymentType: "",
      });
      continue;
    }

    for (const [taskId, work] of day.tasks) {
      const task = taskById.get(taskId);
      const fee = task?.amount || 0;
      rows.push({
        ...base,
        taskId,
        taskTitle: task?.title || "",
        clientName: name(input.clients, task?.client_id),
        seconds: Math.max(0, work.seconds),
        status: task?.status || "",
        feesReceived: work.fees,
        paymentType: work.fees > 0 ? (fee > 0 && paidThrough(taskId, day.date) >= fee ? "Full" : "Partial") : "",
      });
    }
  }

  return rows.sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      a.staffName.localeCompare(b.staffName) ||
      a.clientName.localeCompare(b.clientName)
  );
}
