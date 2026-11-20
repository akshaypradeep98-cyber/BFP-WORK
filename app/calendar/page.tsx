"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import NavbarRefined from "@/components/NavbarRefined";
import EventModal, { EditingEvent } from "./components/EventModal";
import NotesPanel from "./components/NotesPanel";
import { getCurrentUserFromCookies } from "@/lib/auth";
import { isTaskOpen } from "@/lib/utils";

interface EventType {
  id: number;
  name: string;
  color: string;
}

interface Employee {
  id: number;
  name: string;
}

interface Task {
  id: number;
  title: string;
  due_date: string | null;
  status: string;
}

const VIEW_STORAGE_KEY = "calendar_view";

export default function CalendarPage() {
  const router = useRouter();
  const calendarRef = useRef<FullCalendar | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isPrivileged, setIsPrivileged] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [occurrences, setOccurrences] = useState<any[]>([]);
  const [range, setRange] = useState<{ start: string; end: string } | null>(null);

  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [mineOnly, setMineOnly] = useState(false);

  const [modalState, setModalState] = useState<{
    open: boolean;
    initialStart?: string;
    initialEnd?: string;
    editing?: EditingEvent | null;
  }>({ open: false });
  const [notesDate, setNotesDate] = useState<string | null>(null);

  useEffect(() => {
    const empId = document.cookie
      .split("; ")
      .find((row) => row.startsWith("employee_id="))
      ?.split("=")[1];
    if (!empId) {
      router.push("/login");
      return;
    }

    const user = getCurrentUserFromCookies();
    setIsPrivileged(user?.classification === "admin" || user?.classification === "manager");

    fetch("/api/calendar/event-types").then((r) => (r.ok ? r.json() : [])).then(setEventTypes).catch(() => {});
    fetch("/api/tasks").then((r) => (r.ok ? r.json() : [])).then(setTasks).catch(() => {});

    setIsLoading(false);
  }, [router]);

  useEffect(() => {
    if (isPrivileged) {
      fetch("/api/employees/directory").then((r) => (r.ok ? r.json() : [])).then(setEmployees).catch(() => {});
    }
  }, [isPrivileged]);

  const fetchOccurrences = useCallback(async () => {
    if (!range) return;
    const params = new URLSearchParams({ from: range.start, to: range.end });
    if (eventTypeFilter) params.set("event_type_id", eventTypeFilter);
    if (mineOnly) params.set("mine_only", "true");
    else if (employeeFilter) params.set("employee_id", employeeFilter);

    const res = await fetch(`/api/calendar/events?${params.toString()}`);
    if (res.ok) setOccurrences(await res.json());
  }, [range, eventTypeFilter, employeeFilter, mineOnly]);

  useEffect(() => {
    fetchOccurrences();
  }, [fetchOccurrences]);

  const calendarEvents = useMemo(() => {
    const real = occurrences.map((occ) => ({
      id: `${occ.event_id}__${occ.start}`,
      title: occ.title,
      start: occ.start,
      end: occ.end,
      allDay: occ.all_day,
      backgroundColor: occ.event_type?.color || "#7c3aed",
      borderColor: occ.event_type?.color || "#7c3aed",
      extendedProps: { kind: "event", ...occ },
    }));

    const taskMarkers = tasks
      .filter((t) => t.due_date && isTaskOpen(t.status))
      .map((t) => ({
        id: `task__${t.id}`,
        title: `📋 ${t.title}`,
        start: t.due_date!,
        allDay: true,
        backgroundColor: "#64748b",
        borderColor: "#64748b",
        editable: false,
        extendedProps: { kind: "task", taskId: t.id },
      }));

    return [...real, ...taskMarkers];
  }, [occurrences, tasks]);

  const handleEventClick = (info: any) => {
    const props = info.event.extendedProps;
    if (props.kind === "task") {
      router.push(`/tasks/${props.taskId}`);
      return;
    }
    setModalState({
      open: true,
      editing: {
        event_id: props.event_id,
        title: info.event.title,
        start: info.event.startStr,
        end: info.event.endStr || info.event.startStr,
        all_day: info.event.allDay,
        event_type: props.event_type,
        location: props.location,
        priority: props.priority,
        recurrence_rule: props.recurrence_rule,
        occurrence_start: props.start,
      },
    });
  };

  const handleSelect = (info: any) => {
    setModalState({ open: true, initialStart: info.startStr, initialEnd: info.endStr, editing: null });
    info.view.calendar.unselect();
  };

  const handleEventDrop = async (info: any) => {
    const props = info.event.extendedProps;
    if (props.kind === "task") {
      info.revert();
      return;
    }
    if (props.recurrence_rule) {
      alert("Drag-and-drop reschedule isn't supported for recurring events yet — edit the event instead.");
      info.revert();
      return;
    }
    const res = await fetch(`/api/calendar/events/${props.event_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start_at: info.event.start.toISOString(),
        end_at: (info.event.end || info.event.start).toISOString(),
      }),
    });
    if (!res.ok) {
      info.revert();
    } else {
      fetchOccurrences();
    }
  };

  const handleDatesSet = (arg: any) => {
    setRange({ start: arg.startStr, end: arg.endStr });
    localStorage.setItem(VIEW_STORAGE_KEY, arg.view.type);
  };

  const initialView = typeof window !== "undefined" ? localStorage.getItem(VIEW_STORAGE_KEY) || "dayGridMonth" : "dayGridMonth";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-orange-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-orange-50">
      <NavbarRefined />

      <div className="px-11 py-9">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Calendar 📅</h1>
            <p className="text-slate-600">Deadlines, meetings and notes in one place</p>
          </div>
          <button
            onClick={() => setModalState({ open: true, editing: null })}
            className="px-6 py-3 bg-gradient-to-r from-violet-600 to-pink-500 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-violet-600/30 transition"
          >
            + New Event
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-5">
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
          >
            <option value="">All types</option>
            {eventTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 bg-white px-3 py-2 rounded-lg border border-slate-200">
            <input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} />
            Mine only
          </label>

          {isPrivileged && !mineOnly && (
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            >
              <option value="">All employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          )}

          <span className="text-xs text-slate-500 ml-auto">
            Click an empty day/slot to add a note · drag to create an event · 📋 markers are task deadlines
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-violet-500/6">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView={initialView}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
            }}
            selectable
            editable
            dayMaxEvents={3}
            events={calendarEvents}
            select={handleSelect}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventDrop}
            datesSet={handleDatesSet}
            dateClick={(info) => {
              if (info.jsEvent.target instanceof HTMLElement && info.jsEvent.target.closest(".fc-daygrid-day-number")) {
                setNotesDate(info.dateStr);
              }
            }}
            height="auto"
          />
        </div>
      </div>

      {modalState.open && (
        <EventModal
          initialStart={modalState.initialStart}
          initialEnd={modalState.initialEnd}
          editing={modalState.editing}
          canAssignOthers={isPrivileged}
          onClose={() => setModalState({ open: false })}
          onSaved={fetchOccurrences}
        />
      )}

      {notesDate && <NotesPanel date={notesDate} onClose={() => setNotesDate(null)} />}
    </div>
  );
}
