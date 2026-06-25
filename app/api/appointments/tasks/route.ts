import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// GET tasks waiting for checks for current employee
export async function GET(request: NextRequest) {
  try {
    const employeeIdHeader = request.headers.get("X-Employee-Id");
    if (!employeeIdHeader) {
      return NextResponse.json(
        { error: "Employee ID required" },
        { status: 400 }
      );
    }

    const employeeId = parseInt(employeeIdHeader);

    // Get tasks where employee is the one who completed them and they're waiting for checks
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("id, title, client_id, check_status")
      .eq("employee_id", employeeId)
      .in("check_status", ["waiting_for_checker", "checking_level1"]);

    if (error) {
      console.error("Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich with client names
    const enriched = await Promise.all(
      (tasks || []).map(async (task: any) => {
        const { data: client } = await supabase
          .from("clients")
          .select("id, name")
          .eq("id", task.client_id)
          .single();

        return {
          ...task,
          client,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}
