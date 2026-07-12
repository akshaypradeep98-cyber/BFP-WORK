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
    // Support both "text" and "title" fields
    const text = body.text || body.title;
    const { notes, sort_order } = body;

    if (!text) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    // If sort_order not provided, get max sort_order for this template
    let finalSortOrder = sort_order;
    if (finalSortOrder === undefined) {
      const { data: maxData } = await supabase
        .from("template_subtasks")
        .select("sort_order")
        .eq("template_id", id)
        .order("sort_order", { ascending: false })
        .limit(1);

      finalSortOrder = (maxData && maxData[0]?.sort_order + 1) || 1;
    }

    const { data, error } = await supabase
      .from("template_subtasks")
      .insert([
        {
          template_id: id,
          text,
          notes: notes || null,
          sort_order: finalSortOrder,
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
