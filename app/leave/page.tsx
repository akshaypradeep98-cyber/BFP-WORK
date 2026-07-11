"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavbarRefined from "@/components/NavbarRefined";

export default function LeavePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-orange-50">
      <NavbarRefined />

      <div className="px-11 py-9 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Leave 🏖️</h1>
          <p className="text-slate-600">Request time off and track approvals</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-violet-500/6 mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Apply for Leave</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">
                Employee
              </label>
              <select className="w-full px-3.5 py-3 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                <option>Akshay</option>
                <option>Hari</option>
                <option>Treesa</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">
                From Date
              </label>
              <input
                type="date"
                className="w-full px-3.5 py-3 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">
                To Date
              </label>
              <input
                type="date"
                className="w-full px-3.5 py-3 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">
                Reason (optional)
              </label>
              <textarea
                placeholder="Reason for leave..."
                className="w-full px-3.5 py-3 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
          <button className="mt-6 px-6 py-3 bg-gradient-to-r from-violet-600 to-pink-500 text-white text-sm font-bold rounded-lg hover:shadow-lg hover:shadow-violet-600/30 transition">
            Apply for Leave
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-7 shadow-sm border border-violet-500/6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Pending Requests</h2>
              <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
                1
              </span>
            </div>
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                H
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900">Hari</div>
                <div className="text-sm text-slate-600 font-semibold">
                  Jun 19 – Jun 19 • Personal
                </div>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold whitespace-nowrap">
                Pending
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-7 shadow-sm border border-violet-500/6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Approved Leaves</h2>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                1
              </span>
            </div>
            <div className="p-4 bg-green-50 rounded-2xl border border-green-200 flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                T
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900">Treesa</div>
                <div className="text-sm text-slate-600 font-semibold">
                  Jun 26 – Jun 27 • Family function
                </div>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold whitespace-nowrap">
                ✓ Approved
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
