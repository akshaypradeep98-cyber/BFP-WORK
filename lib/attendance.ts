import { localDate, localTime, parseUtc } from "./dailyReport";

export interface Session {
  login_at: string;
  logout_at: string | null;
}

export interface LeaveSpan {
  from_date: string;
  to_date: string;
}

export interface AttendanceDay {
  date: string; // YYYY-MM-DD, Indian calendar day
  checkIn: string; // HH:MM or ""
  checkOut: string; // HH:MM, "" while still logged in
  seconds: number; // closed sessions only
  status: "Present" | "Half day" | "Logged in" | "On leave";
}

const HALF_DAY_SECONDS = 4 * 3600;

function eachDate(from: string, to: string): string[] {
  const out: string[] = [];
  const d = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (d <= end) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

// One row per day that has a login or approved leave, newest first.
export function summariseAttendance(
  sessions: Session[],
  leave: LeaveSpan[],
  from: string,
  to: string
): AttendanceDay[] {
  const byDate = new Map<string, Session[]>();
  for (const s of sessions) {
    const date = localDate(s.login_at);
    byDate.set(date, [...(byDate.get(date) || []), s]);
  }

  const onLeave = (date: string) => leave.some((l) => l.from_date <= date && date <= l.to_date);

  const days: AttendanceDay[] = [];
  for (const date of eachDate(from, to)) {
    const daySessions = byDate.get(date);
    if (!daySessions) {
      if (onLeave(date)) days.push({ date, checkIn: "", checkOut: "", seconds: 0, status: "On leave" });
      continue;
    }

    const logins = daySessions.map((s) => s.login_at).sort();
    const stillIn = daySessions.some((s) => !s.logout_at);
    const lastOut = daySessions
      .map((s) => s.logout_at)
      .filter((v): v is string => !!v)
      .sort()
      .pop();
    const seconds = daySessions.reduce(
      (sum, s) =>
        s.logout_at
          ? sum + Math.max(0, (parseUtc(s.logout_at).getTime() - parseUtc(s.login_at).getTime()) / 1000)
          : sum,
      0
    );

    days.push({
      date,
      checkIn: localTime(logins[0]),
      checkOut: !stillIn && lastOut ? localTime(lastOut) : "",
      seconds: Math.round(seconds),
      status: stillIn ? "Logged in" : seconds < HALF_DAY_SECONDS ? "Half day" : "Present",
    });
  }

  return days.reverse();
}
