import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const employeeId = request.cookies.get("employee_id");
  const pathname = request.nextUrl.pathname;

  // Allow access to login page without authentication
  if (pathname === "/login") {
    return NextResponse.next();
  }

  // Allow access to auth API routes without authentication
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // Protect all authenticated page routes
  const protectedPageRoutes = [
    "/dashboard",
    "/employees",
    "/clients",
    "/tasks",
    "/calendar",
    "/billing",
    "/leave",
    "/reports",
    "/attendance",
    "/templates",
  ];

  const isProtectedPageRoute = protectedPageRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // Protect API routes that exist
  const protectedApiRoutes = [
    "/api/employees",
    "/api/clients",
    "/api/tasks",
    "/api/templates",
  ];

  const isProtectedApiRoute = protectedApiRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedPageRoute || isProtectedApiRoute) {
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
