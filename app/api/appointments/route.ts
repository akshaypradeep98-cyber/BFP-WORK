import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createRequestClient } from "@/lib/supabase/server";
import { withScheduledParts } from "@/lib/appointments";


// GET user's appointments
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRequestClient();
    const employeeIdHeader = request.headers.get("X-Employee-Id");
    if (!employeeIdHeader) {
      return NextResponse.json(
        { error: "Employee ID required" },
        { status: 400 }
      );
    }

    const employeeId = parseInt(employeeIdHeader);

    const { data: appointments, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich with task, manager, and queue info
    const enriched = await Promise.all(
      (appointments || []).map(async (apt: any) => {
        // Get task
        const { data: task } = await supabase
          .from("tasks")
          .select("id, title")
          .eq("id", apt.task_id)
          .single();

        // Get manager (name-only lookup: the caller usually isn't
        // admin/manager themselves, so this can't use their RLS-scoped client)
        const { data: manager } = await createAdminClient()
          .from("employees")
          .select("id, name")
          .eq("id", apt.manager_id)
          .single();

        // Get queue position
        const { data: queueCount } = await supabase
          .from("appointments")
          .select("id", { count: "exact" })
          .eq("manager_id", apt.manager_id)
          .neq("status", "completed")
          .neq("status", "cancelled")
          .lt("created_at", apt.created_at);

        return {
          ...withScheduledParts(apt),
          task,
          manager,
          queue_position: (queueCount?.length || 0) + 1,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

// POST create appointment
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRequestClient();
    const { task_id, employee_id, manager_id, check_type } = await request.json();

    if (!task_id || !employee_id || !manager_id || !check_type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data: apt, error } = await supabase
      .from("appointments")
      .insert([
        {
          task_id,
          employee_id,
          manager_id,
          check_type,
          status: "requested",
        },
      ])
      .select();

    if (error) {
      console.error("Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get queue position
    const { data: queueCount } = await supabase
      .from("appointments")
      .select("id", { count: "exact" })
      .eq("manager_id", manager_id)
      .neq("status", "completed")
      .neq("status", "cancelled")
      .lt("created_at", apt[0].created_at);

    return NextResponse.json({
      ...apt[0],
      queue_position: (queueCount?.length || 0) + 1,
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}
