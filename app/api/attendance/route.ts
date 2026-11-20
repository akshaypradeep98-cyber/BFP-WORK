import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createRequestClient } from "@/lib/supabase/server";
import { dayStartUtc } from "@/lib/dailyReport";
import { summariseAttendance } from "@/lib/attendance";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function nextDay(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

// GET /api/attendance?from=YYYY-MM-DD&to=YYYY-MM-DD[&employee_id=]
// Staff always get their own days; managers/admins may pick anyone.
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRequestClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    const { data: me } = await admin
      .from("employees")
      .select("id, classification")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (!me) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    const canViewOthers = me.classification === "admin" || me.classification === "manager";
    const params = request.nextUrl.searchParams;
    const from = params.get("from") || "";
    const to = params.get("to") || "";
    if (!DATE.test(from) || !DATE.test(to) || to < from) {
      return NextResponse.json({ error: "Pick a valid date range." }, { status: 400 });
    }

    const requested = parseInt(params.get("employee_id") || "");
    const employeeId = canViewOthers && requested ? requested : me.id;

    const [sessions, leave, employees] = await Promise.all([
      admin
        .from("attendance")
        .select("login_at, logout_at")
        .eq("employee_id", employeeId)
        .gte("login_at", dayStartUtc(from))
        .lt("login_at", dayStartUtc(nextDay(to))),
      admin
        .from("leave_requests")
        .select("from_date, to_date")
        .eq("employee_id", employeeId)
        .eq("status", "approved")
        .lte("from_date", to)
        .gte("to_date", from),
      canViewOthers
        ? admin.from("employees").select("id, name").order("name")
        : admin.from("employees").select("id, name").eq("id", me.id),
    ]);

    const failed = [sessions, leave, employees].find((r) => r.error);
    if (failed?.error) return NextResponse.json({ error: failed.error.message }, { status: 500 });

    return NextResponse.json({
      employeeId,
      canViewOthers,
      employees: employees.data || [],
      days: summariseAttendance(sessions.data || [], leave.data || [], from, to),
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}
