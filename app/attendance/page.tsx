"use client";

import { useCallback, useEffect, useState } from "react";
import NavbarRefined from "@/components/NavbarRefined";
import { formatTime } from "@/lib/taskTemplates";
import type { AttendanceDay } from "@/lib/attendance";

const STATUS_STYLES: Record<AttendanceDay["status"], string> = {
  Present: "bg-green-100 text-green-700",
  "Half day": "bg-amber-100 text-amber-800",
  "Logged in": "bg-blue-100 text-blue-700",
  "On leave": "bg-purple-100 text-purple-700",
};

function isoLocal(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
}

function formatDay(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function AttendancePage() {
  const [from, setFrom] = useState(() => isoLocal(-6));
  const [to, setTo] = useState(() => isoLocal(0));
  const [employeeId, setEmployeeId] = useState("");
  const [days, setDays] = useState<AttendanceDay[]>([]);
  const [employees, setEmployees] = useState<{ id: number; name: string }[]>([]);
  const [canViewOthers, setCanViewOthers] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ from, to });
      if (employeeId) params.set("employee_id", employeeId);
      const response = await fetch(`/api/attendance?${params}`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load attendance");
      }
      const data = await response.json();
      setDays(data.days || []);
      setEmployees(data.employees || []);
      setCanViewOthers(!!data.canViewOthers);
      if (!employeeId) setEmployeeId(String(data.employeeId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load attendance");
      setDays([]);
    } finally {
      setIsLoading(false);
    }
  }, [from, to, employeeId]);

  useEffect(() => {
    if (from && to && to >= from) load();
  }, [from, to, employeeId, load]);

  const count = (status: AttendanceDay["status"]) => days.filter((d) => d.status === status).length;
  const worked = days.filter((d) => d.seconds > 0);
  const avgSeconds = worked.length ? worked.reduce((s, d) => s + d.seconds, 0) / worked.length : 0;
  const field =
    "px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-orange-50">
      <NavbarRefined />

      <div className="px-4 sm:px-11 py-9">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Attendance ⏱️</h1>
          <p className="text-slate-600">Log in and log out times, day by day</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 flex flex-wrap items-end gap-3">
          {canViewOthers && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Employee</label>
              <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className={`${field} min-w-48`}>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={field} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">To</label>
            <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className={field} />
          </div>
        </div>

        {error && <p className="mb-4 text-sm font-semibold text-red-700">{error}</p>}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-7">
          {[
            { label: "Present", value: count("Present"), color: "text-green-600" },
            { label: "Half day", value: count("Half day"), color: "text-amber-700" },
            { label: "On leave", value: count("On leave"), color: "text-violet-600" },
            { label: "Avg hours", value: avgSeconds ? formatTime(Math.round(avgSeconds)) : "—", color: "text-pink-500" },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{card.label}</div>
              <div className={`text-4xl font-bold ${card.color}`}>{card.value}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold">Log in</th>
                <th className="px-6 py-4 font-bold">Log out</th>
                <th className="px-6 py-4 font-bold">Hours</th>
                <th className="px-6 py-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Loading...
                  </td>
                </tr>
              ) : days.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No logins or leave in these dates.
                  </td>
                </tr>
              ) : (
                days.map((d) => (
                  <tr key={d.date}>
                    <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">{formatDay(d.date)}</td>
                    <td className="px-6 py-4 font-semibold text-slate-600">{d.checkIn || "—"}</td>
                    <td className="px-6 py-4 font-semibold text-slate-600">{d.checkOut}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{d.seconds ? formatTime(d.seconds) : ""}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${STATUS_STYLES[d.status]}`}>
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Log out stays blank until the person logs out. Hours count only finished sessions; under 4 hours shows as a
          half day. Attendance is recorded from 20 Nov 2026.
        </p>
      </div>
    </div>
  );
}
