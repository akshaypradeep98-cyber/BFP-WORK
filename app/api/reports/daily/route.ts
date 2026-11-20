import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { buildDailyReport, dayStartUtc } from "@/lib/dailyReport";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function nextDay(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

// GET /api/reports/daily?from=YYYY-MM-DD&to=YYYY-MM-DD[&employee_id=]
// Manager/admin only (middleware). Reads across every employee, so it uses
// the admin client.
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const from = params.get("from") || "";
    const to = params.get("to") || "";
    const employeeId = params.get("employee_id");

    if (!DATE.test(from) || !DATE.test(to) || to < from) {
      return NextResponse.json({ error: "Pick a valid date range." }, { status: 400 });
    }

    const start = dayStartUtc(from);
    const end = dayStartUtc(nextDay(to));
    const admin = createAdminClient();

    let attendanceQuery = admin
      .from("attendance")
      .select("employee_id, login_at, logout_at")
      .gte("login_at", start)
      .lt("login_at", end);
    let entriesQuery = admin
      .from("time_entries")
      .select("task_id, employee_id, seconds, logged_at")
      .gte("logged_at", start)
      .lt("logged_at", end);
    if (employeeId) {
      attendanceQuery = attendanceQuery.eq("employee_id", parseInt(employeeId));
      entriesQuery = entriesQuery.eq("employee_id", parseInt(employeeId));
    }

    const [attendance, entries, payments, employees, clients] = await Promise.all([
      attendanceQuery,
      entriesQuery,
      admin.from("payments").select("task_id, amount, payment_date").gte("payment_date", from).lte("payment_date", to),
      admin.from("employees").select("id, name").order("name"),
      admin.from("clients").select("id, name"),
    ]);

    const failed = [attendance, entries, payments, employees, clients].find((r) => r.error);
    if (failed?.error) {
      return NextResponse.json({ error: failed.error.message }, { status: 500 });
    }

    const taskIds = [
      ...new Set([...(entries.data || []).map((e) => e.task_id), ...(payments.data || []).map((p) => p.task_id)]),
    ];
    const [tasks, allPayments] = taskIds.length
      ? await Promise.all([
          admin.from("tasks").select("id, title, client_id, employee_id, status, amount").in("id", taskIds),
          admin.from("payments").select("task_id, amount, payment_date").in("task_id", taskIds),
        ])
      : [{ data: [], error: null }, { data: [], error: null }];

    let rows = buildDailyReport({
      attendance: attendance.data || [],
      entries: entries.data || [],
      payments: payments.data || [],
      allPaymentsForTasks: allPayments.data || [],
      tasks: tasks.data || [],
      employees: employees.data || [],
      clients: clients.data || [],
    });
    if (employeeId) rows = rows.filter((r) => r.employeeId === parseInt(employeeId));

    return NextResponse.json({ rows, employees: employees.data || [] });
  } catch (error) {
    console.error("Error building daily report:", error);
    return NextResponse.json({ error: "Failed to build the daily report" }, { status: 500 });
  }
}
