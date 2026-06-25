import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // Get all Level 1 checks that are in_progress
    const { data: checks, error } = await supabase
      .from("task_checks")
      .select("*")
      .eq("check_level", 1)
      .eq("status", "in_progress")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich with task, client, worker info
    const enriched = await Promise.all(
      (checks || []).map(async (check: any) => {
        // Get task
        const { data: task } = await supabase
          .from("tasks")
          .select("*")
          .eq("id", check.task_id)
          .single();

        // Get client
        const { data: client } = await supabase
          .from("clients")
          .select("*")
          .eq("id", task?.client_id)
          .single();

        // Get worker
        const { data: worker } = await supabase
          .from("employees")
          .select("*")
          .eq("id", task?.employee_id)
          .single();

        return {
          id: check.id,
          task_id: check.task_id,
          checker_id: check.checker_id,
          check_level: check.check_level,
          status: check.status,
          created_at: check.created_at,
          task_title: task?.title,
          client_name: client?.name,
          worker_name: worker?.name,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Error fetching checks:", error);
    return NextResponse.json(
      { error: "Failed to fetch checks" },
      { status: 500 }
    );
  }
}
