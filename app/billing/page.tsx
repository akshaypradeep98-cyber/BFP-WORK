"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavbarRefined from "@/components/NavbarRefined";

interface BillingRecord {
  id: number;
  client: string;
  task: string;
  amount: string;
  received: string;
  balance: string;
  status: string;
  statusBg: string;
  statusColor: string;
  avatar_color: string;
}

export default function BillingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("client");

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

  const billingData: BillingRecord[] = [
    {
      id: 1,
      client: "Adani",
      task: "ROC annual filing",
      amount: "₹25,000",
      received: "₹25,000",
      balance: "₹0",
      status: "Paid",
      statusBg: "bg-green-100",
      statusColor: "text-green-700",
      avatar_color: "#7c3aed",
    },
    {
      id: 2,
      client: "Zenith Corp",
      task: "GST returns – Q1",
      amount: "₹40,000",
      received: "₹40,000",
      balance: "₹0",
      status: "Paid",
      statusBg: "bg-green-100",
      statusColor: "text-green-700",
      avatar_color: "#ec4899",
    },
    {
      id: 3,
      client: "Nova Retail",
      task: "Statutory audit FY24-25",
      amount: "₹60,000",
      received: "₹25,000",
      balance: "₹35,000",
      status: "Partial",
      statusBg: "bg-amber-100",
      statusColor: "text-amber-800",
      avatar_color: "#0ea5e9",
    },
    {
      id: 4,
      client: "Orchid Foods",
      task: "TDS filing – Q1",
      amount: "₹30,000",
      received: "₹0",
      balance: "₹30,000",
      status: "Unpaid",
      statusBg: "bg-red-100",
      statusColor: "text-red-700",
      avatar_color: "#f59e0b",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-orange-50">
      <NavbarRefined />

      <div className="px-11 py-9">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Billing 💰</h1>
          <p className="text-slate-600">Track receivables across every client engagement</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl p-7 text-white shadow-lg shadow-violet-600/28 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>
            <div className="font-bold text-sm mb-2 relative">Total Payable</div>
            <div className="text-4xl font-bold relative">₹1,55,000</div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-7 text-white shadow-lg shadow-green-600/28 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>
            <div className="font-bold text-sm mb-2 relative">Received</div>
            <div className="text-4xl font-bold relative">₹90,000</div>
          </div>

          <div className="bg-gradient-to-br from-red-600 to-rose-600 rounded-2xl p-7 text-white shadow-lg shadow-red-600/28 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>
            <div className="font-bold text-sm mb-2 relative">Outstanding</div>
            <div className="text-4xl font-bold relative">₹65,000</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: "client", label: "By Client" },
            { id: "division", label: "By Division" },
            { id: "period", label: "By Client & Period" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-violet-600 to-pink-500 text-white shadow-lg shadow-violet-600/30"
                  : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-violet-500/6 overflow-hidden">
          <div className="grid grid-cols-6 gap-6 px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wide bg-slate-50 border-b border-slate-100">
            <div>Client</div>
            <div>Task</div>
            <div>Amount</div>
            <div>Received</div>
            <div>Balance</div>
            <div>Status</div>
          </div>

          <div className="divide-y divide-slate-100">
            {billingData.map((record, idx) => (
              <div
                key={record.id}
                className={`grid grid-cols-6 gap-6 px-6 py-4 items-center hover:bg-slate-50 transition ${
                  idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs"
                    style={{ backgroundColor: record.avatar_color }}
                  >
                    {record.client.charAt(0)}
                  </div>
                  <span className="font-bold text-sm text-slate-900">{record.client}</span>
                </div>
                <div className="font-semibold text-sm text-slate-600">{record.task}</div>
                <div className="font-bold text-sm text-slate-900">{record.amount}</div>
                <div className="font-bold text-sm text-green-600">{record.received}</div>
                <div className="font-bold text-sm text-slate-900">{record.balance}</div>
                <div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${record.statusBg} ${record.statusColor}`}>
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
