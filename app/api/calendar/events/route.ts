import { NextRequest, NextResponse } from "next/server";
import { createRequestClient } from "@/lib/supabase/server";
import { expandOccurrences } from "@/lib/calendar";

// GET events expanded into occurrences within [from, to].
// RLS on calendar_events already scopes rows to what this caller may
// see; this route just expands recurrence on top of that.
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRequestClient();
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const employeeId = searchParams.get("employee_id");
    const eventTypeId = searchParams.get("event_type_id");
    const mineOnly = searchParams.get("mine_only") === "true";

    if (!from || !to) {
      return NextResponse.json({ error: "from and to are required" }, { status: 400 });
    }

    const rangeStart = new Date(from);
    const rangeEnd = new Date(to);

    let query = supabase
      .from("calendar_events")
      .select("*, event_type:event_type_id(id, name, color), attendees:event_attendees(employee_id)")
      .is("deleted_at", null)
      .lte("start_at", to)
      .or(`recurrence_rule.not.is.null,end_at.gte.${from}`);

    if (eventTypeId) query = query.eq("event_type_id", eventTypeId);

    const { data: events, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    const { data: me } = user
      ? await supabase.from("employees").select("id").eq("auth_user_id", user.id).single()
      : { data: null };

    let filtered = events || [];
    if (mineOnly && me) {
      filtered = filtered.filter(
        (e: any) =>
          e.created_by === me.id ||
          (e.attendees || []).some((a: any) => a.employee_id === me.id)
      );
    } else if (employeeId) {
      const empId = parseInt(employeeId);
      filtered = filtered.filter(
        (e: any) =>
          e.created_by === empId ||
          (e.attendees || []).some((a: any) => a.employee_id === empId)
      );
    }

    const eventIds = filtered.map((e: any) => e.id);
    let exceptionsByEvent = new Map<number, any[]>();
    if (eventIds.length > 0) {
      const { data: exceptions } = await supabase
        .from("event_exceptions")
        .select("*")
        .in("event_id", eventIds);

      (exceptions || []).forEach((ex: any) => {
        if (!exceptionsByEvent.has(ex.event_id)) exceptionsByEvent.set(ex.event_id, []);
        exceptionsByEvent.get(ex.event_id)!.push(ex);
      });
    }

    const occurrences = filtered.flatMap((e: any) =>
      expandOccurrences(e, rangeStart, rangeEnd, exceptionsByEvent.get(e.id) || []).map((occ) => ({
        ...occ,
        event: e,
      }))
    );

    return NextResponse.json(
      occurrences.map((occ) => ({
        event_id: occ.eventId,
        title: occ.title,
        start: occ.start.toISOString(),
        end: occ.end.toISOString(),
        is_exception: occ.isException,
        all_day: occ.event.all_day,
        event_type: occ.event.event_type,
        related_task_id: occ.event.related_task_id,
        location: occ.event.location,
        priority: occ.event.priority,
        status: occ.event.status,
        created_by: occ.event.created_by,
        recurrence_rule: occ.event.recurrence_rule,
      }))
    );
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json({ error: "Failed to fetch calendar events" }, { status: 500 });
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
    const {
      title,
      description,
      event_type_id,
      start_at,
      end_at,
      all_day,
      location,
      related_task_id,
      priority,
      created_by,
      recurrence_rule,
      recurrence_end,
      attendee_ids,
      reminder_minutes_before,
    } = body;

    if (!title || !start_at || !end_at) {
      return NextResponse.json({ error: "title, start_at and end_at are required" }, { status: 400 });
    }
    if (new Date(end_at) < new Date(start_at)) {
      return NextResponse.json({ error: "end_at must not be before start_at" }, { status: 400 });
    }

    const { data: event, error } = await supabase
      .from("calendar_events")
      .insert([
        {
          title,
          description: description || null,
          event_type_id: event_type_id || null,
          start_at,
          end_at,
          all_day: !!all_day,
          location: location || null,
          related_task_id: related_task_id || null,
          priority: priority || "normal",
          // admin/manager may assign the event to someone else via
          // created_by; RLS still requires the caller to be privileged
          // for that to be allowed, so no extra check needed here.
          created_by: created_by || me.id,
          recurrence_rule: recurrence_rule || null,
          recurrence_end: recurrence_end || null,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (attendee_ids && attendee_ids.length > 0) {
      await supabase.from("event_attendees").insert(
        attendee_ids.map((id: number) => ({ event_id: event.id, employee_id: id }))
      );
    }

    if (reminder_minutes_before) {
      await supabase.from("event_reminders").insert([
        { event_id: event.id, remind_minutes_before: reminder_minutes_before, channel: "in_app" },
      ]);
    }

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Error creating calendar event:", error);
    return NextResponse.json({ error: "Failed to create calendar event" }, { status: 500 });
  }
}
