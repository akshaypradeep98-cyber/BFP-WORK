import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// PUT update leave request (approve/reject)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, approved_by } = body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    // Get the leave request to find the employee
    const { data: leaveRequest, error: fetchError } = await supabase
      .from("leave_requests")
      .select("employee_id")
      .eq("id", parseInt(id))
      .single();

    if (fetchError || !leaveRequest) {
      return NextResponse.json(
        { error: "Leave request not found" },
        { status: 404 }
      );
    }

    // Update leave request
    const updateData: any = { status, updated_at: new Date().toISOString() };
    if (approved_by) updateData.approved_by = approved_by;

    const { data, error } = await supabase
      .from("leave_requests")
      .update(updateData)
      .eq("id", parseInt(id))
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If approved, update employee's on_leave flag
    if (status === "approved") {
      const { error: updateError } = await supabase
        .from("employees")
        .update({ on_leave: true })
        .eq("id", leaveRequest.employee_id);

      if (updateError) {
        console.error("Error updating employee on_leave:", updateError);
      }
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("Error updating leave request:", error);
    return NextResponse.json(
      { error: "Failed to update leave request" },
      { status: 500 }
    );
  }
}
