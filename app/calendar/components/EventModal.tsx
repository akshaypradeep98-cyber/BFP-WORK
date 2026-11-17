"use client";

import { useEffect, useState } from "react";

interface EventType {
  id: number;
  name: string;
  color: string;
}

interface Employee {
  id: number;
  name: string;
}

export interface EditingEvent {
  event_id: number;
  title: string;
  start: string;
  end: string;
  all_day: boolean;
  event_type?: { id: number } | null;
  location?: string | null;
  priority?: string;
  recurrence_rule?: string | null;
  occurrence_start?: string;
}

interface EventModalProps {
  initialStart?: string;
  initialEnd?: string;
  editing?: EditingEvent | null;
  canAssignOthers: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventModal({
  initialStart,
  initialEnd,
  editing,
  canAssignOthers,
  onClose,
  onSaved,
}: EventModalProps) {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [title, setTitle] = useState(editing?.title || "");
  const [description, setDescription] = useState("");
  const [eventTypeId, setEventTypeId] = useState(editing?.event_type?.id?.toString() || "");
  const [startAt, setStartAt] = useState(
    editing ? toLocalInputValue(editing.start) : initialStart ? toLocalInputValue(initialStart) : ""
  );
  const [endAt, setEndAt] = useState(
    editing ? toLocalInputValue(editing.end) : initialEnd ? toLocalInputValue(initialEnd) : ""
  );
  const [allDay, setAllDay] = useState(editing?.all_day || false);
  const [location, setLocation] = useState(editing?.location || "");
  const [priority, setPriority] = useState(editing?.priority || "normal");
  const [recurrenceRule, setRecurrenceRule] = useState(editing?.recurrence_rule || "");
  const [recurrenceEnd, setRecurrenceEnd] = useState("");
  const [attendeeIds, setAttendeeIds] = useState<number[]>([]);
  const [assigneeId, setAssigneeId] = useState("");
  const [reminderMinutes, setReminderMinutes] = useState("");
  const [editScope, setEditScope] = useState<"series" | "occurrence">("series");

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const isEditingRecurring = !!editing?.recurrence_rule;
  const isEdit = !!editing;

  useEffect(() => {
    fetch("/api/calendar/event-types").then((r) => (r.ok ? r.json() : [])).then(setEventTypes).catch(() => {});
    if (canAssignOthers) {
      fetch("/api/employees/directory").then((r) => (r.ok ? r.json() : [])).then(setEmployees).catch(() => {});
    }
  }, [canAssignOthers]);

  const toggleAttendee = (id: number) => {
    setAttendeeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!startAt || !endAt) {
      setError("Start and end are required");
      return;
    }
    if (new Date(endAt) < new Date(startAt)) {
      setError("End must not be before start");
      return;
    }

    setIsSaving(true);
    try {
      if (isEdit && editing) {
        const payload: Record<string, any> = {
          title: title.trim(),
          description: description.trim() || null,
          event_type_id: eventTypeId ? parseInt(eventTypeId) : null,
          start_at: new Date(startAt).toISOString(),
          end_at: new Date(endAt).toISOString(),
          all_day: allDay,
          location: location.trim() || null,
          priority,
        };

        if (isEditingRecurring && editScope === "occurrence") {
          payload.scope = "occurrence";
          payload.occurrence_start = editing.occurrence_start || editing.start;
        } else {
          payload.recurrence_rule = recurrenceRule || null;
          payload.recurrence_end = recurrenceRule ? recurrenceEnd || null : null;
        }

        const res = await fetch(`/api/calendar/events/${editing.event_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || "Failed to update event");
        }
      } else {
        const res = await fetch("/api/calendar/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || null,
            event_type_id: eventTypeId ? parseInt(eventTypeId) : null,
            start_at: new Date(startAt).toISOString(),
            end_at: new Date(endAt).toISOString(),
            all_day: allDay,
            location: location.trim() || null,
            priority,
            recurrence_rule: recurrenceRule || null,
            recurrence_end: recurrenceRule ? recurrenceEnd || null : null,
            attendee_ids: attendeeIds,
            created_by: assigneeId ? parseInt(assigneeId) : undefined,
            reminder_minutes_before: reminderMinutes ? parseInt(reminderMinutes) : undefined,
          }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || "Failed to create event");
        }
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    const deletingOccurrenceOnly = isEditingRecurring && editScope === "occurrence";
    const confirmMsg = deletingOccurrenceOnly
      ? "Cancel just this occurrence?"
      : "Delete this event? This cannot be undone.";
    if (!confirm(confirmMsg)) return;

    setIsDeleting(true);
    try {
      const url = deletingOccurrenceOnly
        ? `/api/calendar/events/${editing.event_id}?occurrence_start=${encodeURIComponent(editing.occurrence_start || editing.start)}`
        : `/api/calendar/events/${editing.event_id}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to delete event");
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to delete event");
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-slate-900 mb-5">{isEdit ? "Edit Event" : "New Event"}</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-semibold">
            {error}
          </div>
        )}

        {isEdit && isEditingRecurring && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <label className="block text-xs font-bold text-amber-900 mb-2">This is a recurring event. Apply changes to:</label>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-1.5">
                <input type="radio" checked={editScope === "occurrence"} onChange={() => setEditScope("occurrence")} />
                Just this occurrence
              </label>
              <label className="flex items-center gap-1.5">
                <input type="radio" checked={editScope === "series"} onChange={() => setEditScope("series")} />
                Entire series
              </label>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              disabled={isSaving}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              disabled={isSaving}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Start</label>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">End</label>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                disabled={isSaving}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} disabled={isSaving} />
            All day
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Type</label>
              <select
                value={eventTypeId}
                onChange={(e) => setEventTypeId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                disabled={isSaving}
              >
                <option value="">None</option>
                {eventTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                disabled={isSaving}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Location / link</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              disabled={isSaving}
            />
          </div>

          {(!isEdit || editScope === "series") && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Repeats</label>
                <select
                  value={recurrenceRule}
                  onChange={(e) => setRecurrenceRule(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  disabled={isSaving}
                >
                  <option value="">Does not repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              {recurrenceRule && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Repeat until</label>
                  <input
                    type="date"
                    value={recurrenceEnd}
                    onChange={(e) => setRecurrenceEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    disabled={isSaving}
                  />
                </div>
              )}
            </div>
          )}

          {!isEdit && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Remind me</label>
              <select
                value={reminderMinutes}
                onChange={(e) => setReminderMinutes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                disabled={isSaving}
              >
                <option value="">No reminder</option>
                <option value="60">1 hour before</option>
                <option value="1440">1 day before</option>
              </select>
            </div>
          )}

          {canAssignOthers && !isEdit && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Assign to</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                disabled={isSaving}
              >
                <option value="">Myself</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!isEdit && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Invite attendees</label>
              <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto border border-slate-200 rounded-lg p-2">
                {employees.length === 0 && <p className="text-xs text-slate-400">No other employees to invite</p>}
                {employees.map((emp) => (
                  <label
                    key={emp.id}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer border ${
                      attendeeIds.includes(emp.id)
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-white text-slate-600 border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={attendeeIds.includes(emp.id)}
                      onChange={() => toggleAttendee(emp.id)}
                    />
                    {emp.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving || isDeleting}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-semibold text-sm"
              >
                {isDeleting ? "Deleting..." : isEditingRecurring && editScope === "occurrence" ? "Cancel occurrence" : "Delete"}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving || isDeleting}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isDeleting}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-violet-600 to-pink-500 text-white rounded-lg font-bold text-sm hover:shadow-lg hover:shadow-violet-600/30 transition disabled:opacity-60"
            >
              {isSaving ? "Saving..." : isEdit ? "Save Changes" : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
