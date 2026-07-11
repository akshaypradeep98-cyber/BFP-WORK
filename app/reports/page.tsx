"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavbarRefined from "@/components/NavbarRefined";

export default function ReportsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const empId = document.cookie
        .split("; ")
        .find((row) => row.startsWith("employee_id="))
        ?.split("=")[1];

      const classification = document.cookie
        .split("; ")
        .find((row) => row.startsWith("employee_classification="))
        ?.split("=")[1];

      if (!empId) {
        router.push("/login");
        return;
      }

      if (classification !== "admin") {
        router.push("/dashboard");
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

  const members = [
    { name: "Akshay", capacity: "100h", barWidth: "3%" },
    { name: "Hari", capacity: "60h", barWidth: "3%" },
    { name: "Treesa", capacity: "80h", barWidth: "3%" },
  ];

  const taskStatuses = [
    { label: "To Do", count: "0", color: "bg-slate-400" },
    { label: "In Progress", count: "0", color: "bg-violet-600" },
    { label: "In Review", count: "0", color: "bg-amber-500" },
    { label: "Done", count: "0", color: "bg-green-600" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-orange-50">
      <NavbarRefined />

      <div className="px-11 py-9">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Reports 📊</h1>
          <p className="text-slate-600">Utilization and output trends for your team</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-6 mb-7">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-violet-500/6">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Avg Utilization
            </div>
            <div className="text-4xl font-bold text-violet-600">0%</div>
            <div className="text-xs text-green-600 font-bold mt-2">Capacity wide open</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-violet-500/6">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Tasks Completed
            </div>
            <div className="text-4xl font-bold text-green-600">0</div>
            <div className="text-xs text-slate-600 font-bold mt-2">This month</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-violet-500/6">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Active Clients
            </div>
            <div className="text-4xl font-bold text-pink-500">4</div>
            <div className="text-xs text-slate-600 font-bold mt-2">Engaged accounts</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-violet-500/6">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Total Capacity
            </div>
            <div className="text-4xl font-bold text-amber-500">240h</div>
            <div className="text-xs text-slate-600 font-bold mt-2">Available weekly</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-3 gap-6">
          {/* Capacity by Member */}
          <div className="col-span-2 bg-white rounded-2xl p-7 shadow-sm border border-violet-500/6">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Capacity by Member</h2>
            <div className="space-y-5">
              {members.map((member) => (
                <div key={member.name}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-bold text-slate-700">{member.name}</span>
                    <span className="text-sm font-bold text-slate-900">{member.capacity}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-600 to-pink-500 rounded-full"
                      style={{ width: member.barWidth }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Task Status */}
          <div className="bg-white rounded-2xl p-7 shadow-sm border border-violet-500/6">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Task Status</h2>
            <div className="space-y-4">
              {taskStatuses.map((status) => (
                <div key={status.label} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
                  <span className="flex-1 text-sm font-bold text-slate-700">{status.label}</span>
                  <span className="text-sm font-bold text-slate-900">{status.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
