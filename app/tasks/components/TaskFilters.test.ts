import { describe, it, expect } from "vitest";
import { applyTaskFilters, DEFAULT_TASK_FILTERS, newRule, TaskFilterState } from "./TaskFilters";

const task = (over: Partial<Parameters<typeof applyTaskFilters>[0][number]>) => ({
  title: "ITR filing",
  status: "prog",
  check_status: "pending",
  employee_id: 3,
  client_id: 1,
  tax_period: "25-26",
  due_date: "2026-12-01",
  amount: 5000,
  total_seconds: 3600,
  ...over,
});

const tasks = [
  task({}),
  task({ title: "GST return", status: "completed", employee_id: 4, client_id: 2, tax_period: "24-25" }),
  task({ title: "Audit", status: "done", check_status: "checking_level1", amount: 20000, due_date: null }),
];

const rule = (r: Partial<ReturnType<typeof newRule>> & { field: ReturnType<typeof newRule>["field"] }) => ({
  ...newRule(r.field),
  ...r,
});

describe("applyTaskFilters", () => {
  it("hides completed tasks by default", () => {
    expect(applyTaskFilters(tasks, DEFAULT_TASK_FILTERS).map((t) => t.title)).toEqual(["ITR filing", "Audit"]);
  });

  it("ANDs rules in all-of mode and ORs them in any-of mode", () => {
    const rules = [rule({ field: "employee", values: ["4"] }), rule({ field: "taxYear", values: ["25-26"] })];
    expect(applyTaskFilters(tasks, { match: "all", rules })).toHaveLength(0);
    expect(applyTaskFilters(tasks, { match: "any", rules })).toHaveLength(3);
  });

  it("supports multiple values, is-not, text, numbers and empty dates", () => {
    const f = (r: TaskFilterState["rules"]) => applyTaskFilters(tasks, { match: "all", rules: r }).map((t) => t.title);
    expect(f([rule({ field: "status", values: ["done", "completed"] })])).toEqual(["GST return", "Audit"]);
    expect(f([rule({ field: "title", op: "not_contains", value: "gst" })])).toEqual(["ITR filing", "Audit"]);
    expect(f([rule({ field: "amount", op: "gte", value: "10000" })])).toEqual(["Audit"]);
    expect(f([rule({ field: "due", op: "empty" })])).toEqual(["Audit"]);
  });

  it("ignores rules that aren't filled in yet", () => {
    expect(applyTaskFilters(tasks, { match: "all", rules: [rule({ field: "client" })] })).toHaveLength(3);
  });
});
