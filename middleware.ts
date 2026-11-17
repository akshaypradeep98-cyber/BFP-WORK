import { NextRequest, NextResponse } from "next/server";
import { getUserAndResponse } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = ["/login", "/api/auth"];
const ADMIN_PAGES = ["/employees", "/templates", "/billing", "/reports", "/invoices", "/dsc", "/activity"];
const MANAGER_PAGES = ["/check/level2", "/manager"];
const ADMIN_WRITE_APIS = ["/api/employees", "/api/templates", "/api/dsc-register", "/api/divisions", "/api/calendar/event-types"];
const ADMIN_READ_APIS = ["/api/reports", "/api/activity-log", "/api/payments"];
const MANAGER_WRITE_APIS = ["/api/clients", "/api/leave-requests", "/api/checks/level2", "/api/manager"];
const STATIC_FILE = /\.[a-z0-9]+$/i;

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");

  // No `config.matcher` export: Next 15.5 silently skipped this file when one was present,
  // so static assets are excluded here instead
  if (pathname.startsWith("/_next") || STATIC_FILE.test(pathname)) {
    return NextResponse.next();
  }

  if (startsWithAny(pathname, PUBLIC_PATHS)) {
    return NextResponse.next();
  }

  const { user, supabase, response } = await getUserAndResponse(request);

  if (!user) {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // RLS lets an authenticated user read only their own employees row,
  // so this is scoped correctly without needing an admin client.
  const { data: employee } = await supabase
    .from("employees")
    .select("classification")
    .eq("auth_user_id", user.id)
    .single();

  const role = employee?.classification;
  const isAdmin = role === "admin";
  const isManager = isAdmin || role === "manager";
  const isWrite = request.method !== "GET";

  const forbidden =
    (!isAdmin && startsWithAny(pathname, ADMIN_PAGES)) ||
    (!isManager && startsWithAny(pathname, MANAGER_PAGES)) ||
    (!isAdmin && startsWithAny(pathname, ADMIN_READ_APIS)) ||
    (!isAdmin && isWrite && startsWithAny(pathname, ADMIN_WRITE_APIS)) ||
    (!isAdmin && pathname === "/api/tasks" && request.method === "POST") ||
    (!isAdmin && pathname.startsWith("/api/tasks/") && request.method === "DELETE") ||
    (!isManager && isWrite && startsWithAny(pathname, MANAGER_WRITE_APIS));

  if (forbidden) {
    if (isApi) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}
