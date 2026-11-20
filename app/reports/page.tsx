"use client";

import { useCallback, useEffect, useState } from "react";
import NavbarRefined from "@/components/NavbarRefined";
import { formatTime } from "@/lib/taskTemplates";
import type { DailyReportRow } from "@/lib/dailyReport";

const STATUS_LABELS: Record<string, string> = {
  todo: "To do",
  prog: "In progress",
  done: "Done (in checking)",
  completed: "Completed",
};

const rupees = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(n);

function todayLocal() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

function formatDay(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function toCsv(rows: DailyReportRow[]) {
  const header = [
    "Date",
    "Staff name",
    "Log in time",
    "Log out time",
    "Client",
    "Task",
    "Time spent",
    "Status",
    "Fees received",
    "Full or partial",
  ];
  const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [
      r.date,
      r.staffName,
      r.loginTime,
      r.logoutTime,
      r.clientName,
      r.taskTitle,
      r.seconds ? formatTime(r.seconds) : "",
      STATUS_LABELS[r.status] || r.status,
      r.feesReceived || "",
      r.paymentType,
    ]
      .map(cell)
      .join(",")
  );
  return [header.map(cell).join(","), ...lines].join("\n");
}

export default function ReportsPage() {
  const [from, setFrom] = useState(todayLocal);
  const [to, setTo] = useState(todayLocal);
  const [employeeId, setEmployeeId] = useState("");
  const [rows, setRows] = useState<DailyReportRow[]>([]);
  const [employees, setEmployees] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ from, to });
      if (employeeId) params.set("employee_id", employeeId);
      const response = await fetch(`/api/reports/daily?${params}`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load the report");
      }
      const data = await response.json();
      setRows(data.rows || []);
      setEmployees(data.employees || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load the report");
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [from, to, employeeId]);

  useEffect(() => {
    if (from && to && to >= from) load();
  }, [from, to, employeeId, load]);

  const downloadCsv = () => {
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily-work-${from}${from === to ? "" : `-to-${to}`}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalSeconds = rows.reduce((s, r) => s + r.seconds, 0);
  const totalFees = rows.reduce((s, r) => s + r.feesReceived, 0);
  const field = "px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-orange-50">
      <NavbarRefined />

      <div className="px-4 sm:px-11 py-9">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Daily Work Report 📊</h1>
          <p className="text-slate-600">Who logged in, what they worked on, and fees received — day by day</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={field} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">To</label>
            <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className={field} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Staff</label>
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className={field}>
              <option value="">Everyone</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              const t = todayLocal();
              setFrom(t);
              setTo(t);
            }}
            className="px-3 py-2 text-sm font-semibold text-violet-700 hover:text-violet-900"
          >
            Today
          </button>
          <div className="flex-1" />
          <button
            onClick={downloadCsv}
            disabled={!rows.length}
            className="px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ⬇ Download CSV
          </button>
        </div>

        {error && <p className="mb-4 text-sm font-semibold text-red-700">{error}</p>}

        <div className="mb-3 text-sm text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
          <span className="font-semibold">{rows.length} row{rows.length === 1 ? "" : "s"}</span>
          <span>
            Time spent: <span className="font-semibold text-slate-800">{formatTime(totalSeconds)}</span>
          </span>
          <span>
            Fees received: <span className="font-semibold text-slate-800">{rupees(totalFees)}</span>
          </span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-700">
              <tr>
                {["Date", "Staff name", "Log in", "Log out", "Client", "Task", "Time spent", "Status", "Fees received", "Full / partial"].map(
                  (h) => (
                    <th key={h} className="px-4 py-3 font-semibold whitespace-nowrap">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                    Loading...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                    No logins, time or fees recorded for these dates.
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={`${r.date}-${r.employeeId}-${r.taskId ?? "none"}-${i}`} className="border-t border-slate-100">
                    <td className="px-4 py-2.5 whitespace-nowrap">{formatDay(r.date)}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-900 whitespace-nowrap">{r.staffName}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">{r.loginTime}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">{r.logoutTime}</td>
                    <td className="px-4 py-2.5">{r.clientName}</td>
                    <td className="px-4 py-2.5">
                      {r.taskId ? (
                        <a href={`/tasks/${r.taskId}`} className="text-violet-700 hover:underline">
                          {r.taskTitle}
                        </a>
                      ) : null}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">{r.seconds ? formatTime(r.seconds) : ""}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">{STATUS_LABELS[r.status] || r.status}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">{r.feesReceived ? rupees(r.feesReceived) : ""}</td>
                    <td className="px-4 py-2.5">
                      {r.paymentType && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            r.paymentType === "Full" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {r.paymentType}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Log out is blank when the person hasn&apos;t logged out. Time spent is recorded day by day from 20 Nov 2026; time logged before then isn&apos;t dated, so it doesn&apos;t appear here.
        </p>
      </div>
    </div>
  );
}
