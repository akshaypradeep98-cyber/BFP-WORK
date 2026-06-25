import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// GET all activity logs with employee names
export async function GET(request: NextRequest) {
  try {
    const { data: logs, error } = await supabase
      .from("activity_log")
      .select("*")
      .order("timestamp", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch all employees for name mapping
    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("id, name");

    if (empError) {
      return NextResponse.json({ error: empError.message }, { status: 500 });
    }

    // Map employee names to activity logs
    const enrichedLogs = logs.map((log: any) => ({
      ...log,
      employee_name: employees?.find((e: any) => e.id === log.employee_id)?.name || "Unknown",
    }));

    return NextResponse.json(enrichedLogs || []);
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity logs" },
      { status: 500 }
    );
  }
}
