import { describe, it, expect } from "vitest";
import { canCompleteTask, getTaxPeriods, isTaskOpen } from "./utils";

describe("getTaxPeriods", () => {
  it("returns 21 periods for the default 10-before/10-after range", () => {
    expect(getTaxPeriods()).toHaveLength(21);
  });

  it("returns periods sorted from furthest-future to furthest-past", () => {
    const periods = getTaxPeriods(2, 2);
    expect(periods).toHaveLength(5);
    for (let i = 0; i < periods.length - 1; i++) {
      const [startA] = periods[i].split("-").map(Number);
      const [startB] = periods[i + 1].split("-").map(Number);
      expect(startA).toBeGreaterThan(startB);
    }
  });

  it("formats each period as two-digit start-end years one apart", () => {
    const periods = getTaxPeriods(1, 1);
    periods.forEach((p) => {
      const match = p.match(/^(\d{2})-(\d{2})$/);
      expect(match).not.toBeNull();
      const start = Number(match![1]);
      const end = Number(match![2]);
      expect((start + 1) % 100).toBe(end);
    });
  });

  it("with 0/0 returns exactly the current financial year", () => {
    const now = new Date();
    const fyStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const expected = `${String(fyStart % 100).padStart(2, "0")}-${String((fyStart + 1) % 100).padStart(2, "0")}`;
    expect(getTaxPeriods(0, 0)).toEqual([expected]);
  });
});

describe("canCompleteTask", () => {
  it("needs Level 2 approval and every step done", () => {
    expect(canCompleteTask("approved", [{ done: true }, { done: true }])).toBe(true);
    expect(canCompleteTask("approved", [{ done: true }, { done: false }])).toBe(false);
    expect(canCompleteTask("checking_level2", [{ done: true }])).toBe(false);
    expect(canCompleteTask("approved", [])).toBe(false);
  });
});

describe("isTaskOpen", () => {
  it("treats done and completed as closed", () => {
    expect(isTaskOpen("todo")).toBe(true);
    expect(isTaskOpen("prog")).toBe(true);
    expect(isTaskOpen("done")).toBe(false);
    expect(isTaskOpen("completed")).toBe(false);
  });
});
