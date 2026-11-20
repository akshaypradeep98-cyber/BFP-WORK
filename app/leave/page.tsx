"use client";

import { useEffect, useState } from "react";
import NavbarRefined from "@/components/NavbarRefined";
import { getInitials } from "@/lib/utils";

interface LeaveRequest {
  id: number;
  employee_id: number;
  employee_name: string;
  avatar_color: string | null;
  from_date: string;
  to_date: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  approver_name: string | null;
  created_at: string;
}

const inputClass =
  "w-full px-3.5 py-3 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500";

function readCookie(name: string) {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="))
    ?.split("=")[1];
}

function formatRange(from: string, to: string) {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  return from === to ? fmt(from) : `${fmt(from)} – ${fmt(to)}`;
}

export default function LeavePage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isManager, setIsManager] = useState(false);
  const [myName, setMyName] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchRequests = async () => {
    try {
      const response = await fetch("/api/leave-requests");
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load leave requests");
      }
      setRequests(await response.json());
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to load leave requests" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const role = readCookie("employee_classification");
    setIsManager(role === "admin" || role === "manager");
    setMyName(decodeURIComponent(readCookie("employee_name") || ""));
    fetchRequests();
  }, []);

  const handleApply = async () => {
    setMessage(null);
    if (!fromDate || !toDate) {
      setMessage({ type: "error", text: "Pick both From and To dates." });
      return;
    }
    if (toDate < fromDate) {
      setMessage({ type: "error", text: "To date can't be before From date." });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/leave-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from_date: fromDate, to_date: toDate, reason }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to apply for leave");
      }
      setFromDate("");
      setToDate("");
      setReason("");
      setMessage({ type: "success", text: "Leave request sent for approval." });
      await fetchRequests();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to apply for leave" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecision = async (id: number, status: "approved" | "rejected") => {
    setMessage(null);
    try {
      const response = await fetch(`/api/leave-requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to update leave request");
      }
      await fetchRequests();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to update leave request" });
    }
  };

  const pending = requests.filter((r) => r.status === "pending");
  const decided = requests.filter((r) => r.status !== "pending");

  const renderRequest = (r: LeaveRequest) => {
    const tone =
      r.status === "approved"
        ? "bg-green-50 border-green-200"
        : r.status === "rejected"
        ? "bg-red-50 border-red-200"
        : "bg-amber-50 border-amber-200";
    const badge =
      r.status === "approved"
        ? "bg-green-100 text-green-700"
        : r.status === "rejected"
        ? "bg-red-100 text-red-700"
        : "bg-amber-100 text-amber-800";
    const label = r.status === "approved" ? "✓ Approved" : r.status === "rejected" ? "Rejected" : "Pending";

    return (
      <div key={r.id} className={`p-4 rounded-2xl border flex items-start gap-3.5 ${tone}`}>
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold flex-shrink-0"
          style={{ backgroundColor: r.avatar_color || "#7c3aed" }}
        >
          {getInitials(r.employee_name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-900">{r.employee_name}</div>
          <div className="text-sm text-slate-600 font-semibold">{formatRange(r.from_date, r.to_date)}</div>
          {r.reason && <div className="text-sm text-slate-600 mt-1 break-words">{r.reason}</div>}
          {r.approver_name && r.status !== "pending" && (
            <div className="text-xs text-slate-500 mt-1">
              {r.status === "approved" ? "Approved" : "Rejected"} by {r.approver_name}
            </div>
          )}
          {isManager && r.status === "pending" && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleDecision(r.id, "approved")}
                className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition"
              >
                Approve
              </button>
              <button
                onClick={() => handleDecision(r.id, "rejected")}
                className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition"
              >
                Reject
              </button>
            </div>
          )}
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${badge}`}>{label}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-orange-50">
      <NavbarRefined />

      <div className="px-4 sm:px-11 py-9 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Leave 🏖️</h1>
          <p className="text-slate-600">Request time off and track approvals</p>
        </div>

        {message && (
          <div
            className={`mb-6 px-4 py-3 rounded-xl text-sm font-semibold ${
              message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-violet-500/6 mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Apply for Leave</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Employee</label>
              <input value={myName} disabled className={`${inputClass} bg-slate-50`} />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  if (!toDate || toDate < e.target.value) setToDate(e.target.value);
                }}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">To Date</label>
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(e) => setToDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Reason (optional)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for leave..."
                className={inputClass}
              />
            </div>
          </div>
          <button
            onClick={handleApply}
            disabled={isSubmitting}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-violet-600 to-pink-500 text-white text-sm font-bold rounded-lg hover:shadow-lg hover:shadow-violet-600/30 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Applying..." : "Apply for Leave"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-7 shadow-sm border border-violet-500/6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Pending Requests</h2>
              <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
                {pending.length}
              </span>
            </div>
            <div className="space-y-3">
              {isLoading ? (
                <p className="text-sm text-slate-500">Loading...</p>
              ) : pending.length ? (
                pending.map(renderRequest)
              ) : (
                <p className="text-sm text-slate-500">No pending requests</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-7 shadow-sm border border-violet-500/6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Decided</h2>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                {decided.length}
              </span>
            </div>
            <div className="space-y-3">
              {isLoading ? (
                <p className="text-sm text-slate-500">Loading...</p>
              ) : decided.length ? (
                decided.map(renderRequest)
              ) : (
                <p className="text-sm text-slate-500">No approved or rejected leave yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
