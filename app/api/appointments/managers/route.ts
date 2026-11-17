import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createRequestClient } from "@/lib/supabase/server";


// GET available managers (employees with manager or admin classification)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRequestClient();
    // Any employee booking an appointment needs to see who the managers
    // are, which RLS wouldn't otherwise allow a non-admin/manager caller
    // to query — this is a deliberately narrow admin-client lookup.
    const { data: employees, error } = await createAdminClient()
      .from("employees")
      .select("id, name, classification")
      .in("classification", ["manager", "admin"])
      .order("name");

    if (error) {
      console.error("Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // For each manager, count their pending appointments
    const enriched = await Promise.all(
      (employees || []).map(async (emp: any) => {
        const { data: apts, count } = await supabase
          .from("appointments")
          .select("id", { count: "exact" })
          .eq("manager_id", emp.id)
          .neq("status", "completed")
          .neq("status", "cancelled");

        return {
          ...emp,
          queue_count: count || 0,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Error fetching managers:", error);
    return NextResponse.json(
      { error: "Failed to fetch managers" },
      { status: 500 }
    );
  }
}
