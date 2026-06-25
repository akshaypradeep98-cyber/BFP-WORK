import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// GET available managers (employees with Manager/Senior/Partner classification)
export async function GET(request: NextRequest) {
  try {
    const { data: employees, error } = await supabase
      .from("employees")
      .select("id, name, classification")
      .in("classification", ["Manager", "Senior", "Partner"])
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
