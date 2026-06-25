import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// GET all DSC records
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from("dsc_register")
      .select("*")
      .order("expiry_date", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error fetching DSC register:", error);
    return NextResponse.json(
      { error: "Failed to fetch DSC register" },
      { status: 500 }
    );
  }
}

// POST create a new DSC record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { holder_name, type, expiry_date } = body;

    console.log("Creating DSC record:", { holder_name, type, expiry_date });

    if (!holder_name || !type || !expiry_date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("dsc_register")
      .insert({
        holder_name,
        type,
        expiry_date,
      })
      .select();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("DSC record created successfully:", data);
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("Error creating DSC record:", error);
    return NextResponse.json(
      { error: `Failed to create DSC record: ${error}` },
      { status: 500 }
    );
  }
}
