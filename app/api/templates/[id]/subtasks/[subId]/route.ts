import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// PUT update template subtask
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  try {
    const { id, subId } = await params;
    const body = await request.json();
    // Support both "text" and "title" fields
    const text = body.text || body.title;
    const { notes, sort_order } = body;

    const updateData: any = {};
    if (text !== undefined) updateData.text = text;
    if (notes !== undefined) updateData.notes = notes;
    if (sort_order !== undefined) updateData.sort_order = sort_order;

    const { data, error } = await supabase
      .from("template_subtasks")
      .update(updateData)
      .eq("id", subId)
      .eq("template_id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Subtask not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating template subtask:", error);
    return NextResponse.json(
      { error: "Failed to update template subtask" },
      { status: 500 }
    );
  }
}

// DELETE template subtask
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  try {
    const { id, subId } = await params;

    const { error } = await supabase
      .from("template_subtasks")
      .delete()
      .eq("id", subId)
      .eq("template_id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting template subtask:", error);
    return NextResponse.json(
      { error: "Failed to delete template subtask" },
      { status: 500 }
    );
  }
}
