import { describe, it, expect } from "vitest";
import { buildDailyReport, dayStartUtc, localDate, localTime } from "./dailyReport";

const employees = [
  { id: 3, name: "Treesa" },
  { id: 4, name: "Hari" },
];
const clients = [{ id: 1, name: "Adani" }];
const tasks = [{ id: 10, title: "ITR", client_id: 1, employee_id: 3, status: "prog", amount: 10000 }];

describe("time zone helpers", () => {
  it("uses Indian days and times", () => {
    // 20:00 UTC on the 19th is 01:30 IST on the 20th
    expect(localDate("2026-11-19T20:00:00Z")).toBe("2026-11-20");
    expect(localTime("2026-11-19T20:00:00")).toBe("01:30");
    expect(dayStartUtc("2026-11-20")).toBe("2026-11-19T18:30:00.000Z");
  });
});

describe("buildDailyReport", () => {
  it("joins login, time and fees for a staff member's day", () => {
    const rows = buildDailyReport({
      attendance: [{ employee_id: 3, login_at: "2026-11-20T04:00:00", logout_at: "2026-11-20T12:30:00" }],
      entries: [
        { task_id: 10, employee_id: 3, seconds: 1800, logged_at: "2026-11-20T05:00:00Z" },
        { task_id: 10, employee_id: 3, seconds: 600, logged_at: "2026-11-20T06:00:00Z" },
      ],
      payments: [{ task_id: 10, amount: 4000, payment_date: "2026-11-20" }],
      allPaymentsForTasks: [{ task_id: 10, amount: 4000, payment_date: "2026-11-20" }],
      tasks,
      employees,
      clients,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      date: "2026-11-20",
      staffName: "Treesa",
      loginTime: "09:30",
      logoutTime: "18:00",
      clientName: "Adani",
      seconds: 2400,
      feesReceived: 4000,
      paymentType: "Partial",
    });
  });

  it("leaves logout blank when still logged in, and marks full payment", () => {
    const rows = buildDailyReport({
      attendance: [
        { employee_id: 3, login_at: "2026-11-20T04:00:00", logout_at: "2026-11-20T06:00:00" },
        { employee_id: 3, login_at: "2026-11-20T07:00:00", logout_at: null },
      ],
      entries: [],
      payments: [{ task_id: 10, amount: 6000, payment_date: "2026-11-20" }],
      allPaymentsForTasks: [
        { task_id: 10, amount: 4000, payment_date: "2026-11-18" },
        { task_id: 10, amount: 6000, payment_date: "2026-11-20" },
      ],
      tasks,
      employees,
      clients,
    });
    expect(rows[0].logoutTime).toBe("");
    expect(rows[0].paymentType).toBe("Full");
  });

  it("shows a login-only day with blank work columns", () => {
    const rows = buildDailyReport({
      attendance: [{ employee_id: 4, login_at: "2026-11-20T04:00:00", logout_at: null }],
      entries: [],
      payments: [],
      allPaymentsForTasks: [],
      tasks,
      employees,
      clients,
    });
    expect(rows).toEqual([
      expect.objectContaining({ staffName: "Hari", loginTime: "09:30", logoutTime: "", clientName: "", seconds: 0 }),
    ]);
  });
});
