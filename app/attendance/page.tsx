"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavbarRefined from "@/components/NavbarRefined";

export default function AttendancePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState("Hari");

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

  const attendanceData = [
    { date: "Mon, Jun 15", status: "Present", checkIn: "09:32", checkOut: "18:10", hours: "8h 38m", statusBg: "bg-green-100", statusColor: "text-green-700" },
    { date: "Tue, Jun 16", status: "Present", checkIn: "09:48", checkOut: "18:22", hours: "8h 34m", statusBg: "bg-green-100", statusColor: "text-green-700" },
    { date: "Wed, Jun 17", status: "Half Day", checkIn: "09:40", checkOut: "13:30", hours: "3h 50m", statusBg: "bg-amber-100", statusColor: "text-amber-800" },
    { date: "Thu, Jun 18", status: "Present", checkIn: "09:29", checkOut: "18:05", hours: "8h 36m", statusBg: "bg-green-100", statusColor: "text-green-700" },
    { date: "Fri, Jun 19", status: "On Leave", checkIn: "–", checkOut: "–", hours: "–", statusBg: "bg-purple-100", statusColor: "text-purple-700" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-orange-50">
      <NavbarRefined />

      <div className="px-11 py-9">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Attendance ⏱️</h1>
            <p className="text-slate-600">Daily check-in and hours logged</p>
          </div>
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">
              Filter by Employee
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="px-3.5 py-2.5 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 min-w-48"
            >
              <option>Hari</option>
              <option>Akshay</option>
              <option>Treesa</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-5 mb-7">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-violet-500/6">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Present
            </div>
            <div className="text-4xl font-bold text-green-600">3</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-violet-500/6">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Half Day
            </div>
            <div className="text-4xl font-bold text-amber-700">1</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-violet-500/6">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              On Leave
            </div>
            <div className="text-4xl font-bold text-violet-600">1</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-violet-500/6">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Avg Hours
            </div>
            <div className="text-4xl font-bold text-pink-500">8h 22m</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-violet-500/6 overflow-hidden">
          <div className="grid grid-cols-5 gap-6 p-6 font-bold text-xs text-slate-500 uppercase tracking-wide bg-slate-50 border-b border-slate-100">
            <div>Date</div>
            <div>Check In</div>
            <div>Check Out</div>
            <div>Hours</div>
            <div>Status</div>
          </div>

          <div className="divide-y divide-slate-100">
            {attendanceData.map((record, idx) => (
              <div
                key={idx}
                className="grid grid-cols-5 gap-6 p-6 items-center bg-slate-50 hover:bg-slate-100 transition"
              >
                <div className="font-bold text-sm text-slate-900">{record.date}</div>
                <div className="font-semibold text-sm text-slate-600">{record.checkIn}</div>
                <div className="font-semibold text-sm text-slate-600">{record.checkOut}</div>
                <div className="font-bold text-sm text-slate-900">{record.hours}</div>
                <div>
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-bold ${record.statusBg} ${record.statusColor}`}
                  >
                    {record.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
