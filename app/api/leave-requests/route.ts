import { NextResponse } from "next/server";
import { createAdminClient, createRequestClient } from "@/lib/supabase/server";

type Me = { id: number; classification: string | null };

async function getMe(): Promise<Me | null> {
  const supabase = await createRequestClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("employees")
    .select("id, classification")
    .eq("auth_user_id", user.id)
    .single();
  return data;
}

function isManagerOrAdmin(me: Me) {
  return me.classification === "admin" || me.classification === "manager";
}

// GET leave requests: managers/admins see everyone's, others only their own
export async function GET() {
  try {
    const me = await getMe();
    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Employee names for other people are hidden by RLS on employees,
    // so the lookup goes through the admin client (names only).
    const admin = createAdminClient();
    let query = admin
      .from("leave_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (!isManagerOrAdmin(me)) query = query.eq("employee_id", me.id);

    const { data: requests, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const ids = [
      ...new Set(
        (requests || []).flatMap((r) => [r.employee_id, r.approved_by]).filter(Boolean)
      ),
    ];
    const { data: people } = ids.length
      ? await admin.from("employees").select("id, name, avatar_color").in("id", ids)
      : { data: [] };

    const withNames = (requests || []).map((r) => {
      const employee = people?.find((p) => p.id === r.employee_id);
      return {
        ...r,
        employee_name: employee?.name || "Unknown",
        avatar_color: employee?.avatar_color || null,
        approver_name: people?.find((p) => p.id === r.approved_by)?.name || null,
      };
    });

    return NextResponse.json(withNames);
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    return NextResponse.json({ error: "Failed to fetch leave requests" }, { status: 500 });
  }
}

// POST apply for leave - always for the logged-in employee
export async function POST(request: Request) {
  try {
    const me = await getMe();
    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { from_date, to_date, reason } = await request.json();

    if (!from_date || !to_date) {
      return NextResponse.json({ error: "From and To dates are required" }, { status: 400 });
    }
    if (to_date < from_date) {
      return NextResponse.json({ error: "To date can't be before From date" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("leave_requests")
      .insert({
        employee_id: me.id,
        from_date,
        to_date,
        reason: reason?.trim() || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating leave request:", error);
    return NextResponse.json({ error: "Failed to create leave request" }, { status: 500 });
  }
}
