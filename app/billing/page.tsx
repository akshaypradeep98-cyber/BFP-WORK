"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavbarRefined from "@/components/NavbarRefined";

interface Task {
  id: number;
  title: string;
  client_id: number | null;
  division_id: number | null;
  amount: number;
  tax_period: string | null;
}

interface Payment {
  task_id: number;
  amount: number;
}

interface Client {
  id: number;
  name: string;
}

interface Division {
  id: number;
  name: string;
}

interface BillingRow {
  key: string;
  label: string;
  amount: number;
  received: number;
  balance: number;
}

type Tab = "client" | "division" | "period";

function statusFor(amount: number, received: number) {
  if (amount <= 0) return { label: "—", bg: "bg-slate-100", color: "text-slate-500" };
  if (received >= amount) return { label: "Paid", bg: "bg-green-100", color: "text-green-700" };
  if (received > 0) return { label: "Partial", bg: "bg-amber-100", color: "text-amber-800" };
  return { label: "Unpaid", bg: "bg-red-100", color: "text-red-700" };
}

export default function BillingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("client");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
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

      try {
        const [tasksRes, paymentsRes, clientsRes, divisionsRes] = await Promise.all([
          fetch("/api/tasks"),
          fetch("/api/payments"),
          fetch("/api/clients"),
          fetch("/api/divisions"),
        ]);
        if (tasksRes.ok) setTasks(await tasksRes.json());
        if (paymentsRes.ok) setPayments(await paymentsRes.json());
        if (clientsRes.ok) setClients(await clientsRes.json());
        if (divisionsRes.ok) setDivisions(await divisionsRes.json());
      } catch (error) {
        console.error("Error loading billing data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndFetch();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-orange-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  const receivedByTask = new Map<number, number>();
  payments.forEach((p) => {
    receivedByTask.set(p.task_id, (receivedByTask.get(p.task_id) || 0) + p.amount);
  });

  const clientName = (id: number | null) => clients.find((c) => c.id === id)?.name || "Unassigned";
  const divisionName = (id: number | null) => divisions.find((d) => d.id === id)?.name || "Unassigned";

  const groupKey =
    activeTab === "client"
      ? (t: Task) => ({ key: `c${t.client_id}`, label: clientName(t.client_id) })
      : activeTab === "division"
      ? (t: Task) => ({ key: `d${t.division_id}`, label: divisionName(t.division_id) })
      : (t: Task) => ({
          key: `c${t.client_id}_${t.tax_period}`,
          label: `${clientName(t.client_id)} — ${t.tax_period || "No period"}`,
        });

  const grouped = new Map<string, BillingRow>();
  tasks.forEach((t) => {
    const { key, label } = groupKey(t);
    const received = receivedByTask.get(t.id) || 0;
    const existing = grouped.get(key) || { key, label, amount: 0, received: 0, balance: 0 };
    existing.amount += t.amount || 0;
    existing.received += received;
    existing.balance = existing.amount - existing.received;
    grouped.set(key, existing);
  });

  const rows = Array.from(grouped.values()).sort((a, b) => a.label.localeCompare(b.label));

  const totalPayable = rows.reduce((sum, r) => sum + r.amount, 0);
  const totalReceived = rows.reduce((sum, r) => sum + r.received, 0);
  const totalOutstanding = totalPayable - totalReceived;

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

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
            <div className="text-4xl font-bold relative">{fmt(totalPayable)}</div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-7 text-white shadow-lg shadow-green-600/28 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>
            <div className="font-bold text-sm mb-2 relative">Received</div>
            <div className="text-4xl font-bold relative">{fmt(totalReceived)}</div>
          </div>

          <div className="bg-gradient-to-br from-red-600 to-rose-600 rounded-2xl p-7 text-white shadow-lg shadow-red-600/28 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>
            <div className="font-bold text-sm mb-2 relative">Outstanding</div>
            <div className="text-4xl font-bold relative">{fmt(totalOutstanding)}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: "client" as Tab, label: "By Client" },
            { id: "division" as Tab, label: "By Division" },
            { id: "period" as Tab, label: "By Client & Period" },
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
          <div className="grid grid-cols-5 gap-6 px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wide bg-slate-50 border-b border-slate-100">
            <div>{activeTab === "division" ? "Division" : "Client"}</div>
            <div>Amount</div>
            <div>Received</div>
            <div>Balance</div>
            <div>Status</div>
          </div>

          <div className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <div className="px-6 py-10 text-center text-slate-500 text-sm">No billing data yet.</div>
            ) : (
              rows.map((row, idx) => {
                const status = statusFor(row.amount, row.received);
                return (
                  <div
                    key={row.key}
                    className={`grid grid-cols-5 gap-6 px-6 py-4 items-center hover:bg-slate-50 transition ${
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs bg-violet-600">
                        {row.label.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-sm text-slate-900">{row.label}</span>
                    </div>
                    <div className="font-bold text-sm text-slate-900">{fmt(row.amount)}</div>
                    <div className="font-bold text-sm text-green-600">{fmt(row.received)}</div>
                    <div className="font-bold text-sm text-slate-900">{fmt(row.balance)}</div>
                    <div>
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
