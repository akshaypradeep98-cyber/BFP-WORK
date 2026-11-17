import { NextRequest, NextResponse } from "next/server";
import { createRequestClient } from "@/lib/supabase/server";

const MAX_CONTENT_LENGTH = 10000;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createRequestClient();
    const { id } = await params;
    const body = await request.json();
    const { content, is_private } = body;

    if (content !== undefined && (!content.trim() || content.length > MAX_CONTENT_LENGTH)) {
      return NextResponse.json(
        { error: `Note content must be 1-${MAX_CONTENT_LENGTH} characters` },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (content !== undefined) updateData.content = content;
    if (is_private !== undefined) updateData.is_private = is_private;

    const { data, error } = await supabase
      .from("notes")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createRequestClient();
    const { id } = await params;

    const { error } = await supabase
      .from("notes")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
