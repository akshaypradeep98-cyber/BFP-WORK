import { NextRequest, NextResponse } from "next/server";
import { createRequestClient } from "@/lib/supabase/server";

const MAX_CONTENT_LENGTH = 10000;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRequestClient();
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("task_id");
    const eventId = searchParams.get("event_id");
    const date = searchParams.get("date");

    let query = supabase.from("notes").select("*").is("deleted_at", null);
    if (taskId) query = query.eq("task_id", taskId);
    if (eventId) query = query.eq("event_id", eventId);
    if (date) query = query.eq("note_date", date);

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRequestClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: me } = await supabase
      .from("employees")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    if (!me) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const body = await request.json();
    const { content, is_private, note_date, task_id, event_id } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Note content is required" }, { status: 400 });
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json({ error: `Note must be ${MAX_CONTENT_LENGTH} characters or fewer` }, { status: 400 });
    }

    // Content is stored as the user typed it. Safety comes from the
    // frontend rendering it as plain React text nodes (auto-escaped) and
    // never via dangerouslySetInnerHTML, not from mangling it here.
    const { data, error } = await supabase
      .from("notes")
      .insert([
        {
          content,
          is_private: !!is_private,
          created_by: me.id,
          note_date: note_date || null,
          task_id: task_id || null,
          event_id: event_id || null,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}
