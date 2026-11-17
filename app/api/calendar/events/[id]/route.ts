import { NextRequest, NextResponse } from "next/server";
import { createRequestClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createRequestClient();
    const { id } = await params;

    const { data: event, error } = await supabase
      .from("calendar_events")
      .select("*, event_type:event_type_id(id, name, color), attendees:event_attendees(employee_id)")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const { data: notes } = await supabase
      .from("notes")
      .select("*")
      .eq("event_id", id)
      .is("deleted_at", null);

    return NextResponse.json({ ...event, notes: notes || [] });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

// PUT update an event. Pass `occurrence_start` + `scope: "occurrence"` to
// edit a single occurrence of a recurring series via an exception row,
// instead of the whole series.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createRequestClient();
    const { id } = await params;
    const body = await request.json();
    const {
      scope,
      occurrence_start,
      title,
      description,
      event_type_id,
      start_at,
      end_at,
      all_day,
      location,
      priority,
      status,
      recurrence_rule,
      recurrence_end,
      attendee_ids,
    } = body;

    if (start_at && end_at && new Date(end_at) < new Date(start_at)) {
      return NextResponse.json({ error: "end_at must not be before start_at" }, { status: 400 });
    }

    if (scope === "occurrence") {
      if (!occurrence_start) {
        return NextResponse.json({ error: "occurrence_start is required for scope=occurrence" }, { status: 400 });
      }
      const { data: exception, error } = await supabase
        .from("event_exceptions")
        .upsert(
          {
            event_id: parseInt(id),
            occurrence_start,
            cancelled: false,
            override_title: title || null,
            override_start_at: start_at || null,
            override_end_at: end_at || null,
          },
          { onConflict: "event_id,occurrence_start" }
        )
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json(exception);
    }

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (event_type_id !== undefined) updateData.event_type_id = event_type_id;
    if (start_at !== undefined) updateData.start_at = start_at;
    if (end_at !== undefined) updateData.end_at = end_at;
    if (all_day !== undefined) updateData.all_day = all_day;
    if (location !== undefined) updateData.location = location;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (recurrence_rule !== undefined) updateData.recurrence_rule = recurrence_rule;
    if (recurrence_end !== undefined) updateData.recurrence_end = recurrence_end;

    const { data, error } = await supabase
      .from("calendar_events")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (attendee_ids) {
      await supabase.from("event_attendees").delete().eq("event_id", id);
      if (attendee_ids.length > 0) {
        await supabase.from("event_attendees").insert(
          attendee_ids.map((empId: number) => ({ event_id: parseInt(id), employee_id: empId }))
        );
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

// DELETE: soft-delete the series, or (with ?occurrence_start=...) cancel
// just one occurrence of a recurring series via an exception row.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createRequestClient();
    const { id } = await params;
    const occurrenceStart = request.nextUrl.searchParams.get("occurrence_start");

    if (occurrenceStart) {
      const { error } = await supabase.from("event_exceptions").upsert(
        {
          event_id: parseInt(id),
          occurrence_start: occurrenceStart,
          cancelled: true,
        },
        { onConflict: "event_id,occurrence_start" }
      );
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    const { error } = await supabase
      .from("calendar_events")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
