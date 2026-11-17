import { NextRequest, NextResponse } from "next/server";
import { createRequestClient } from "@/lib/supabase/server";
import { withScheduledParts } from "@/lib/appointments";


// GET manager's appointments
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRequestClient();
    const managerIdHeader = request.headers.get("X-Manager-Id");
    if (!managerIdHeader) {
      return NextResponse.json(
        { error: "Manager ID required" },
        { status: 400 }
      );
    }

    const managerId = parseInt(managerIdHeader);

    const { data: appointments, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("manager_id", managerId)
      .in("status", ["requested", "accepted", "confirmed"])
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich with employee and task info
    const enriched = await Promise.all(
      (appointments || []).map(async (apt: any) => {
        // Get employee
        const { data: employee } = await supabase
          .from("employees")
          .select("id, name")
          .eq("id", apt.employee_id)
          .single();

        // Get task
        const { data: task } = await supabase
          .from("tasks")
          .select("id, title")
          .eq("id", apt.task_id)
          .single();

        // Get queue position (count of requests before this one)
        const { data: queueCount } = await supabase
          .from("appointments")
          .select("id", { count: "exact" })
          .eq("manager_id", managerId)
          .neq("status", "completed")
          .neq("status", "cancelled")
          .neq("status", "declined")
          .lt("created_at", apt.created_at);

        return {
          ...withScheduledParts(apt),
          employee,
          task,
          queue_position: (queueCount?.length || 0) + 1,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Error fetching manager appointments:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}
