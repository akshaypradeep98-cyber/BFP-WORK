import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employee_id, from_date, to_date, tax_period } = body;

    if (!from_date || !to_date) {
      return NextResponse.json(
        { error: "Missing date range" },
        { status: 400 }
      );
    }

    // Fetch all completed subtasks with task and client info
    let query = supabase
      .from("subtasks")
      .select(
        `
        id,
        title,
        done,
        seconds,
        last_logged,
        task:task_id (
          id,
          title,
          client_id,
          employee_id,
          tax_period,
          client:client_id (
            id,
            name
          ),
          employee:employee_id (
            id,
            name
          )
        )
      `
      )
      .eq("done", true);

    // Filter by employee if specified
    if (employee_id) {
      query = query.eq("task.employee_id", employee_id);
    }

    const { data: subtasks, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter by date range (last_logged) and tax period
    const filteredSubtasks = (subtasks || []).filter((st: any) => {
      if (!st.last_logged) return false;
      const loggedDate = new Date(st.last_logged);
      const fromDate = new Date(from_date);
      const toDate = new Date(to_date);
      const dateInRange = loggedDate >= fromDate && loggedDate <= toDate;

      // Filter by tax period if specified
      if (tax_period) {
        const taskPeriod = st.task?.tax_period || "25-26";
        return dateInRange && taskPeriod === tax_period;
      }

      return dateInRange;
    });

    // Generate CSV
    let csv =
      "Date,Employee,Task,Client,Subtask,Tax Period,Done,Time (minutes),Time (hh:mm)\n";

    filteredSubtasks.forEach((st: any) => {
      const loggedDate = new Date(st.last_logged).toLocaleDateString("en-IN");
      const employeeName = st.task?.employee?.name || "—";
      const taskTitle = st.task?.title || "—";
      const clientName = st.task?.client?.name || "—";
      const subtaskTitle = st.title;
      const taxPeriod = st.task?.tax_period || "25-26";
      const done = st.done ? "Yes" : "No";
      const minutes = st.seconds ? Math.round(st.seconds / 60) : 0;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const timeHHMM = `${hours}:${mins.toString().padStart(2, "0")}`;

      const row = [
        loggedDate,
        escapeCSV(employeeName),
        escapeCSV(taskTitle),
        escapeCSV(clientName),
        escapeCSV(subtaskTitle),
        taxPeriod,
        done,
        minutes,
        timeHHMM,
      ].join(",");

      csv += row + "\n";
    });

    // Return CSV file
    const fileName = `work_log_${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Error generating work log:", error);
    return NextResponse.json(
      { error: "Failed to generate work log" },
      { status: 500 }
    );
  }
}

function escapeCSV(value: string): string {
  if (!value) return "";
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
