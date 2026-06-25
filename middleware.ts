import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const employeeId = request.cookies.get("employee_id");
  const pathname = request.nextUrl.pathname;

  // Allow access to login page without authentication
  if (pathname === "/login") {
    return NextResponse.next();
  }

  // Allow access to API routes
  if (pathname.startsWith("/api/auth/login")) {
    return NextResponse.next();
  }

  // Protect all authenticated routes
  if (
    pathname === "/dashboard" ||
    pathname === "/employees" ||
    pathname === "/clients" ||
    pathname === "/tasks" ||
    pathname === "/calendar" ||
    pathname === "/billing" ||
    pathname === "/leave" ||
    pathname === "/reports" ||
    pathname === "/invoices" ||
    pathname === "/dsc" ||
    pathname === "/activity" ||
    pathname === "/attendance" ||
    pathname.startsWith("/tasks/") ||
    pathname.startsWith("/api/employees") ||
    pathname.startsWith("/api/clients") ||
    pathname.startsWith("/api/tasks") ||
    pathname.startsWith("/api/payments") ||
    pathname.startsWith("/api/divisions") ||
    pathname.startsWith("/api/leave-requests") ||
    pathname.startsWith("/api/reports") ||
    pathname.startsWith("/api/dsc-register") ||
    pathname.startsWith("/api/activity-log") ||
    pathname.startsWith("/api/attendance")
  ) {
    if (!employeeId) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // Redirect root to login if not authenticated
  if (pathname === "/" && !employeeId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
