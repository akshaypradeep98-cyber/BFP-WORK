import { NextResponse } from "next/server";
import { createAdminClient, createRequestClient } from "@/lib/supabase/server";

// Names-only employee directory. Any authenticated employee can call
// this (middleware already rejects unauthenticated requests) — it backs
// features like "pick a checker" or "reassign to" that every role needs,
// without exposing headcount, classification, capacity or any other
// field RLS otherwise restricts to admin/manager on GET /api/employees.
export async function GET() {
  try {
    // Confirm the caller has a real session before using the admin
    // client to bypass RLS for this deliberately narrow projection.
    const requestClient = await createRequestClient();
    const {
      data: { user },
    } = await requestClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("employees")
      .select("id, name")
      .order("name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching employee directory:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee directory" },
      { status: 500 }
    );
  }
}
