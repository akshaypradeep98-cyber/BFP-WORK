import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createRequestClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password required" },
        { status: 400 }
      );
    }

    // Username -> email lookup happens before any session exists, so it
    // must bypass RLS. The admin client never leaves this route.
    const admin = createAdminClient();
    const { data: employee, error: queryError } = await admin
      .from("employees")
      .select("id, name, username, email, classification")
      .eq("username", username)
      .single();

    if (queryError || !employee || !employee.email) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // This client is request-scoped: on success it writes the real
    // Supabase Auth session into cookies via @supabase/ssr.
    const supabase = await createRequestClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: employee.email,
      password,
    });

    if (signInError) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Attendance: one row per login; logout fills in logout_at.
    const { error: attendanceError } = await admin
      .from("attendance")
      .insert({ employee_id: employee.id, login_at: new Date().toISOString() });
    if (attendanceError) console.error("Couldn't record login:", attendanceError.message);

    const res = NextResponse.json({
      employee_id: employee.id,
      name: employee.name,
      username: employee.username,
      classification: employee.classification,
    });

    // Display-only cookies for the existing pages/components that read
    // these for UI purposes. Not used for authorization anymore — that's
    // enforced by the Supabase Auth session + RLS + middleware above.
    res.cookies.set("employee_id", String(employee.id), { path: "/", maxAge: 86400 });
    res.cookies.set("employee_name", encodeURIComponent(employee.name), { path: "/", maxAge: 86400 });
    res.cookies.set("employee_classification", employee.classification, { path: "/", maxAge: 86400 });

    return res;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
