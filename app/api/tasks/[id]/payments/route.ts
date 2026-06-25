import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// GET payments for a specific task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const taskId = parseInt(id);
    console.log("Fetching payments for taskId:", taskId);

    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("task_id", taskId)
      .order("payment_date", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: error.message || "Database error" },
        { status: 500 }
      );
    }

    console.log("Payments fetched:", data);
    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

// POST create a new payment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { amount, payment_date, mode } = body;

    const { data, error } = await supabase
      .from("payments")
      .insert({
        task_id: parseInt(id),
        amount,
        payment_date,
        mode,
      })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}
