import { describe, it, expect } from "vitest";
import { summariseAttendance } from "./attendance";

describe("summariseAttendance", () => {
  it("summarises each day and marks leave", () => {
    const days = summariseAttendance(
      [
        { login_at: "2026-11-18T03:30:00", logout_at: "2026-11-18T12:30:00" }, // 09:00-18:00 IST
        { login_at: "2026-11-19T03:30:00", logout_at: "2026-11-19T05:30:00" }, // 2h
        { login_at: "2026-11-20T03:30:00", logout_at: null },
      ],
      [{ from_date: "2026-11-17", to_date: "2026-11-17" }],
      "2026-11-16",
      "2026-11-20"
    );
    expect(days.map((d) => [d.date, d.status, d.checkIn, d.checkOut])).toEqual([
      ["2026-11-20", "Logged in", "09:00", ""],
      ["2026-11-19", "Half day", "09:00", "11:00"],
      ["2026-11-18", "Present", "09:00", "18:00"],
      ["2026-11-17", "On leave", "", ""],
    ]);
    expect(days[2].seconds).toBe(9 * 3600);
  });
});
