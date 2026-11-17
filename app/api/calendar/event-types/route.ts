import { NextRequest, NextResponse } from "next/server";
import { createRequestClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createRequestClient();
    const { data, error } = await supabase
      .from("event_types")
      .select("*")
      .order("name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching event types:", error);
    return NextResponse.json({ error: "Failed to fetch event types" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRequestClient();
    const { name, color } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("event_types")
      .insert([{ name, color: color || "#7c3aed" }])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error("Error creating event type:", error);
    return NextResponse.json({ error: "Failed to create event type" }, { status: 500 });
  }
}
