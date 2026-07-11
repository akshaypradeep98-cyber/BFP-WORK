import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// GET all subtasks for a template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("template_subtasks")
      .select("*")
      .eq("template_id", id)
      .order("sort_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error fetching template subtasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch template subtasks" },
      { status: 500 }
    );
  }
}

// POST add subtask to template
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, notes } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Get max sort_order for this template
    const { data: maxData } = await supabase
      .from("template_subtasks")
      .select("sort_order")
      .eq("template_id", id)
      .order("sort_order", { ascending: false })
      .limit(1);

    const nextSortOrder = (maxData && maxData[0]?.sort_order + 1) || 1;

    const { data, error } = await supabase
      .from("template_subtasks")
      .insert([
        {
          template_id: id,
          title,
          notes: notes || null,
          sort_order: nextSortOrder,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating template subtask:", error);
    return NextResponse.json(
      { error: "Failed to create template subtask" },
      { status: 500 }
    );
  }
}
