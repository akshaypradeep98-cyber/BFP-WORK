export type RecurrenceRule = "daily" | "weekly" | "monthly" | null;

export interface CalendarEventRecord {
  id: number;
  title: string;
  start_at: string;
  end_at: string;
  recurrence_rule: RecurrenceRule;
  recurrence_end: string | null;
}

export interface EventException {
  occurrence_start: string;
  cancelled: boolean;
  override_title: string | null;
  override_start_at: string | null;
  override_end_at: string | null;
}

export interface Occurrence {
  eventId: number;
  title: string;
  start: Date;
  end: Date;
  isException: boolean;
}

const MAX_OCCURRENCES = 500;

function addInterval(date: Date, rule: RecurrenceRule): Date {
  const next = new Date(date);
  if (rule === "daily") next.setDate(next.getDate() + 1);
  else if (rule === "weekly") next.setDate(next.getDate() + 7);
  else if (rule === "monthly") next.setMonth(next.getMonth() + 1);
  return next;
}

/**
 * Expands a single calendar_events row into the occurrences that fall
 * within [rangeStart, rangeEnd], applying per-occurrence exceptions.
 * Non-recurring events just produce their one occurrence if in range.
 */
export function expandOccurrences(
  event: CalendarEventRecord,
  rangeStart: Date,
  rangeEnd: Date,
  exceptions: EventException[] = []
): Occurrence[] {
  const exceptionMap = new Map(
    exceptions.map((ex) => [new Date(ex.occurrence_start).getTime(), ex])
  );

  const duration = new Date(event.end_at).getTime() - new Date(event.start_at).getTime();
  const occurrences: Occurrence[] = [];

  if (!event.recurrence_rule) {
    const start = new Date(event.start_at);
    const end = new Date(event.end_at);
    if (end >= rangeStart && start <= rangeEnd) {
      occurrences.push({ eventId: event.id, title: event.title, start, end, isException: false });
    }
    return occurrences;
  }

  const seriesEnd = event.recurrence_end ? new Date(event.recurrence_end) : rangeEnd;
  let cursor = new Date(event.start_at);
  let count = 0;

  while (cursor <= rangeEnd && cursor <= seriesEnd && count < MAX_OCCURRENCES) {
    count++;
    const occurrenceEnd = new Date(cursor.getTime() + duration);

    if (occurrenceEnd >= rangeStart && cursor <= rangeEnd) {
      const exception = exceptionMap.get(cursor.getTime());

      if (!exception) {
        occurrences.push({ eventId: event.id, title: event.title, start: new Date(cursor), end: occurrenceEnd, isException: false });
      } else if (!exception.cancelled) {
        occurrences.push({
          eventId: event.id,
          title: exception.override_title || event.title,
          start: exception.override_start_at ? new Date(exception.override_start_at) : new Date(cursor),
          end: exception.override_end_at ? new Date(exception.override_end_at) : occurrenceEnd,
          isException: true,
        });
      }
      // cancelled exceptions simply produce no occurrence
    }

    cursor = addInterval(cursor, event.recurrence_rule);
  }

  return occurrences;
}

const DEFAULT_TIMEZONE = "Asia/Kolkata";

export function formatInTimezone(date: Date, timeZone: string = DEFAULT_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
