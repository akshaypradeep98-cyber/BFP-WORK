import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// PUT update appointment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, appointment_date, appointment_time } = body;

    if (action === "set-time") {
      // Set appointment time
      if (!appointment_date || !appointment_time) {
        return NextResponse.json(
          { error: "Date and time required" },
          { status: 400 }
        );
      }

      const { data: apt, error } = await supabase
        .from("appointments")
        .update({
          appointment_date,
          appointment_time,
          status: "confirmed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select();

      if (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(apt[0]);
    }

    if (action === "accept") {
      // Accept appointment request
      const { data: apt, error } = await supabase
        .from("appointments")
        .update({
          status: "accepted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select();

      if (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(apt[0]);
    }

    if (action === "decline") {
      // Decline appointment request
      const { data: apt, error } = await supabase
        .from("appointments")
        .update({
          status: "declined",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select();

      if (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(apt[0]);
    }

    if (action === "complete") {
      // Mark appointment as completed
      const { data: apt, error } = await supabase
        .from("appointments")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select();

      if (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(apt[0]);
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}
