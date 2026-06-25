import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// POST - Create or update subtask verification
export async function POST(request: NextRequest) {
  try {
    const { subtask_id, task_check_id, verified } = await request.json();

    if (!subtask_id || !task_check_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if verification already exists
    const { data: existing, error: selectError } = await supabase
      .from("subtask_verifications")
      .select("id")
      .eq("subtask_id", subtask_id)
      .eq("task_check_id", task_check_id)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      // PGRST116 = no rows returned, which is fine
      console.error("Select error:", selectError);
      return NextResponse.json({ error: selectError.message }, { status: 500 });
    }

    if (existing) {
      // Update existing verification
      const { error: updateError } = await supabase
        .from("subtask_verifications")
        .update({
          verified: verified !== false,
          verified_at: verified ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    } else if (verified) {
      // Create new verification only if verified=true
      const { error: insertError } = await supabase
        .from("subtask_verifications")
        .insert([
          {
            subtask_id,
            task_check_id,
            verified: true,
            verified_at: new Date().toISOString(),
          },
        ]);

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in subtask verification:", error);
    return NextResponse.json(
      { error: "Failed to verify subtask" },
      { status: 500 }
    );
  }
}

// GET - Get all verifications for a check
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const task_check_id = searchParams.get("task_check_id");

    if (!task_check_id) {
      return NextResponse.json(
        { error: "Missing task_check_id" },
        { status: 400 }
      );
    }

    const { data: verifications, error } = await supabase
      .from("subtask_verifications")
      .select("*")
      .eq("task_check_id", task_check_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(verifications || []);
  } catch (error) {
    console.error("Error fetching verifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch verifications" },
      { status: 500 }
    );
  }
}
