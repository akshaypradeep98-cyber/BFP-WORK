import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// GET all bank accounts
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from("bank_accounts")
      .select("*")
      .order("bank_name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error fetching bank accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch bank accounts" },
      { status: 500 }
    );
  }
}

// POST create a new bank account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bank_name, account_number } = body;

    if (!bank_name || !account_number) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("bank_accounts")
      .insert({ bank_name, account_number })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("Error creating bank account:", error);
    return NextResponse.json(
      { error: `Failed to create bank account: ${error}` },
      { status: 500 }
    );
  }
}
