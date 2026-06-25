import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// GET all attendance records with optional employee filter
export async function GET(request: NextRequest) {
  try {
    const employeeId = request.nextUrl.searchParams.get("employee_id");

    let query = supabase
      .from("attendance")
      .select("*")
      .order("login_at", { ascending: false });

    if (employeeId) {
      query = query.eq("employee_id", parseInt(employeeId));
    }

    const { data: records, error } = await query;

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

    // Map employee names to attendance records
    const enrichedRecords = records.map((record: any) => ({
      ...record,
      employee_name: employees?.find((e: any) => e.id === record.employee_id)?.name || "Unknown",
    }));

    return NextResponse.json(enrichedRecords || []);
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance records" },
      { status: 500 }
    );
  }
}
