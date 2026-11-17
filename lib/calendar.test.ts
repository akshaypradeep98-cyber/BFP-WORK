import { describe, it, expect } from "vitest";
import { expandOccurrences, CalendarEventRecord } from "./calendar";

function event(overrides: Partial<CalendarEventRecord> = {}): CalendarEventRecord {
  return {
    id: 1,
    title: "Weekly sync",
    start_at: "2026-01-05T10:00:00.000Z", // Monday
    end_at: "2026-01-05T11:00:00.000Z",
    recurrence_rule: null,
    recurrence_end: null,
    ...overrides,
  };
}

describe("expandOccurrences", () => {
  it("returns a single occurrence for a non-recurring event inside the range", () => {
    const result = expandOccurrences(
      event(),
      new Date("2026-01-01T00:00:00Z"),
      new Date("2026-01-31T00:00:00Z")
    );
    expect(result).toHaveLength(1);
    expect(result[0].start.toISOString()).toBe("2026-01-05T10:00:00.000Z");
  });

  it("excludes a non-recurring event outside the range", () => {
    const result = expandOccurrences(
      event(),
      new Date("2026-02-01T00:00:00Z"),
      new Date("2026-02-28T00:00:00Z")
    );
    expect(result).toHaveLength(0);
  });

  it("expands a weekly recurrence up to its end date", () => {
    const result = expandOccurrences(
      event({ recurrence_rule: "weekly", recurrence_end: "2026-01-26T23:59:59Z" }),
      new Date("2026-01-01T00:00:00Z"),
      new Date("2026-01-31T00:00:00Z")
    );
    // 2026-01-05, 12, 19, 26 -> 4 Mondays
    expect(result).toHaveLength(4);
    expect(result.map((o) => o.start.getUTCDate())).toEqual([5, 12, 19, 26]);
  });

  it("expands a daily recurrence correctly", () => {
    const result = expandOccurrences(
      event({ recurrence_rule: "daily", recurrence_end: "2026-01-08T23:59:59Z" }),
      new Date("2026-01-01T00:00:00Z"),
      new Date("2026-01-31T00:00:00Z")
    );
    expect(result).toHaveLength(4); // Jan 5, 6, 7, 8
  });

  it("expands a monthly recurrence correctly", () => {
    const result = expandOccurrences(
      event({ recurrence_rule: "monthly", recurrence_end: "2026-04-05T23:59:59Z" }),
      new Date("2026-01-01T00:00:00Z"),
      new Date("2026-12-31T00:00:00Z")
    );
    expect(result).toHaveLength(4); // Jan, Feb, Mar, Apr 5th
  });

  it("drops a cancelled occurrence via an exception", () => {
    const result = expandOccurrences(
      event({ recurrence_rule: "weekly", recurrence_end: "2026-01-26T23:59:59Z" }),
      new Date("2026-01-01T00:00:00Z"),
      new Date("2026-01-31T00:00:00Z"),
      [{ occurrence_start: "2026-01-12T10:00:00.000Z", cancelled: true, override_title: null, override_start_at: null, override_end_at: null }]
    );
    expect(result).toHaveLength(3);
    expect(result.map((o) => o.start.getUTCDate())).toEqual([5, 19, 26]);
  });

  it("applies an override to a single occurrence without affecting the rest of the series", () => {
    const result = expandOccurrences(
      event({ recurrence_rule: "weekly", recurrence_end: "2026-01-26T23:59:59Z" }),
      new Date("2026-01-01T00:00:00Z"),
      new Date("2026-01-31T00:00:00Z"),
      [{
        occurrence_start: "2026-01-12T10:00:00.000Z",
        cancelled: false,
        override_title: "Rescheduled sync",
        override_start_at: "2026-01-13T14:00:00.000Z",
        override_end_at: "2026-01-13T15:00:00.000Z",
      }]
    );
    expect(result).toHaveLength(4);
    const moved = result.find((o) => o.isException);
    expect(moved?.title).toBe("Rescheduled sync");
    expect(moved?.start.toISOString()).toBe("2026-01-13T14:00:00.000Z");
    // Untouched occurrences keep the original title
    expect(result.filter((o) => !o.isException).every((o) => o.title === "Weekly sync")).toBe(true);
  });

  it("caps runaway recurrence at the range end even with no recurrence_end set", () => {
    const result = expandOccurrences(
      event({ recurrence_rule: "daily", recurrence_end: null }),
      new Date("2026-01-01T00:00:00Z"),
      new Date("2026-01-10T00:00:00Z")
    );
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((o) => o.start <= new Date("2026-01-10T00:00:00Z"))).toBe(true);
  });
});
