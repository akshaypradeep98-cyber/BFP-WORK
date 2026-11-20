import { NextResponse } from "next/server";
import { createAdminClient, createRequestClient } from "@/lib/supabase/server";

// Closes the caller's latest open attendance row. Called just before the
// browser signs out; if someone never logs out, logout_at stays empty.
export async function POST() {
  try {
    const supabase = await createRequestClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: true });

    const admin = createAdminClient();
    const { data: me } = await admin
      .from("employees")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (!me) return NextResponse.json({ success: true });

    const { data: open } = await admin
      .from("attendance")
      .select("id")
      .eq("employee_id", me.id)
      .is("logout_at", null)
      .order("login_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (open) {
      const { error } = await admin
        .from("attendance")
        .update({ logout_at: new Date().toISOString() })
        .eq("id", open.id);
      if (error) console.error("Couldn't record logout:", error.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ success: true });
  }
}
