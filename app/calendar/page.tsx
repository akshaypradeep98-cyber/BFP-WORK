"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavbarRefined from "@/components/NavbarRefined";

export default function CalendarPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const checkAuth = () => {
      const empId = document.cookie
        .split("; ")
        .find((row) => row.startsWith("employee_id="))
        ?.split("=")[1];

      if (!empId) {
        router.push("/login");
        return;
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-orange-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const days = [];
  const firstDay = getFirstDayOfMonth(currentMonth);
  const daysInMonth = getDaysInMonth(currentMonth);

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const events: Record<number, { label: string; color: string }[]> = {
    10: [{ label: "TDS filing", color: "#10b981" }],
    15: [{ label: "Financials due", color: "#f59e0b" }],
    16: [{ label: "Payroll run", color: "#7c3aed" }],
    18: [{ label: "GST return", color: "#7c3aed" }],
    19: [{ label: "Hari – Leave", color: "#f97316" }],
    24: [{ label: "Client review", color: "#ec4899" }],
    26: [{ label: "Treesa – Leave", color: "#f97316" }],
  };

  const today = new Date().getDate();
  const isCurrentMonth =
    currentMonth.getMonth() === new Date().getMonth() &&
    currentMonth.getFullYear() === new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-orange-50">
      <NavbarRefined />

      <div className="px-11 py-9">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Calendar 📅</h1>
            <p className="text-slate-600">Deadlines, leave and key dates at a glance</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-slate-900">{monthName}</span>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-violet-600 hover:bg-slate-50 transition"
            >
              Today
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-violet-500/6">
          <div className="grid grid-cols-7 gap-2 mb-3">
            {weekdays.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider pb-4"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((day, idx) => (
              <div
                key={idx}
                className={`min-h-24 rounded-xl p-2 border ${
                  day === null
                    ? "bg-transparent border-transparent"
                    : isCurrentMonth && day === today
                    ? "bg-violet-100 border-violet-300"
                    : "bg-slate-50 border-slate-100"
                }`}
              >
                {day && (
                  <>
                    <div
                      className={`text-sm font-bold mb-2 ${
                        isCurrentMonth && day === today
                          ? "text-violet-600"
                          : "text-slate-700"
                      }`}
                    >
                      {day}
                    </div>
                    <div className="space-y-1">
                      {(events[day] || []).map((event, i) => (
                        <div
                          key={i}
                          className="text-xs font-bold text-white px-2 py-1 rounded-md whitespace-nowrap overflow-hidden text-ellipsis"
                          style={{ backgroundColor: event.color }}
                        >
                          {event.label}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
