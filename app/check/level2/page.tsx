"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface PendingApproval {
  id: number;
  task_id: number;
  checker_id: number;
  check_level: number;
  status: string;
  created_at: string;
  task_title: string;
  client_name: string;
  checker_name: string;
}

interface Check {
  id: number;
  task_id: number;
  checker_id: number;
  check_level: number;
  status: string;
  notes: string;
  created_at: string;
}

interface Task {
  id: number;
  title: string;
  client_id: number;
  employee_id: number;
  amount: number;
  tax_period: string;
  check_status: string;
}

interface Client {
  id: number;
  name: string;
}

interface Employee {
  id: number;
  name: string;
}

export default function Level2ApprovalsPage() {
  const router = useRouter();

  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [selectedApprovalId, setSelectedApprovalId] = useState<number | null>(null);
  const [approval, setApproval] = useState<Check | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [level1Check, setLevel1Check] = useState<any | null>(null);
  const [level1Verifications, setLevel1Verifications] = useState<Set<number>>(new Set());
  const [approvalNotes, setApprovalNotes] = useState("");
  const [confirmApproval, setConfirmApproval] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showReassignDropdown, setShowReassignDropdown] = useState(false);

  // Load approvals
  useEffect(() => {
    const load = async () => {
      const employeeName = document.cookie
        .split("; ")
        .find((row) => row.startsWith("employee_name="));

      if (!employeeName) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch("/api/checks/level2");
        if (response.ok) {
          setPendingApprovals(await response.json());
        }

        const empResponse = await fetch("/api/employees");
        if (empResponse.ok) {
          setEmployees(await empResponse.json());
        }
      } catch (error) {
        console.error("Error loading:", error);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [router]);

  // Load approval details
  useEffect(() => {
    if (!selectedApprovalId) return;

    const load = async () => {
      setIsSaving(true);
      try {
        const appRes = await fetch(`/api/checks/level2/${selectedApprovalId}`);
        if (appRes.ok) {
          const appData = await appRes.json();
          setApproval(appData);

          const taskRes = await fetch(`/api/tasks/${appData.task_id}`);
          if (taskRes.ok) {
            const taskData = await taskRes.json();
            setTask(taskData);
          }

          const clientRes = await fetch(`/api/clients/${appData.task.client_id}`);
          if (clientRes.ok) {
            setClient(await clientRes.json());
          }

          // Get Level 1 check
          const l1Res = await fetch(`/api/checks/level1?task_id=${appData.task_id}`);
          if (l1Res.ok) {
            const l1Data = await l1Res.json();
            if (l1Data.length > 0) {
              setLevel1Check(l1Data[0]);

              // Get L1 verifications
              const verRes = await fetch(
                `/api/subtask-verifications?task_check_id=${l1Data[0].id}`
              );
              if (verRes.ok) {
                const verData = await verRes.json();
                setLevel1Verifications(new Set(verData.map((v: any) => v.subtask_id)));
              }
            }
          }
        }
      } catch (error) {
        console.error("Error loading approval details:", error);
      } finally {
        setIsSaving(false);
      }
    };

    load();
  }, [selectedApprovalId]);

  const handleApprove = async () => {
    if (!selectedApprovalId || !confirmApproval) {
      alert("Please confirm you have reviewed the Level 1 check");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/checks/level2/${selectedApprovalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          notes: approvalNotes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      alert("Task approved and completed!");
      setSelectedApprovalId(null);
      const res = await fetch("/api/checks/level2");
      if (res.ok) setPendingApprovals(await res.json());
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApprovalId) return;
    if (!confirm("Send task back for rework?")) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/checks/level2/${selectedApprovalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          notes: approvalNotes,
        }),
      });

      if (!response.ok) throw new Error("Failed to reject");

      alert("Approval rejected");
      setSelectedApprovalId(null);
      const res = await fetch("/api/checks/level2");
      if (res.ok) setPendingApprovals(await res.json());
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReassign = async (newApproverId: number) => {
    if (!selectedApprovalId) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/checks/level2/${selectedApprovalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reassign",
          new_checker_id: newApproverId,
        }),
      });

      if (!response.ok) throw new Error("Failed to reassign");

      alert("Approval reassigned");
      setSelectedApprovalId(null);
      setShowReassignDropdown(false);
      const res = await fetch("/api/checks/level2");
      if (res.ok) setPendingApprovals(await res.json());
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const formatRupees = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1C3350] text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Level 2 Approvals</h1>
            <p className="text-sm text-gray-300 mt-1">Final task approval</p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-white hover:text-gray-300"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Pending ({pendingApprovals.length})
            </h2>
            {pendingApprovals.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No pending approvals</p>
            ) : (
              <div className="space-y-2">
                {pendingApprovals.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSelectedApprovalId(a.id)}
                    className={`w-full text-left p-3 rounded border-2 transition ${
                      selectedApprovalId === a.id
                        ? "border-[#1C3350] bg-blue-50"
                        : "border-gray-200 hover:border-[#1C3350]"
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{a.task_title}</p>
                    <p className="text-sm text-gray-600">{a.client_name}</p>
                    <p className="text-xs text-gray-500">L1: {a.checker_name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main Content */}
          {selectedApprovalId && approval && task ? (
            <div className="lg:col-span-2 space-y-6">
              {/* Header */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
                    <p className="text-gray-600 mt-1">{client?.name}</p>
                  </div>
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded font-semibold text-sm">
                    Level 2 Approval
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Period</p>
                    <p className="font-semibold">FY {task.tax_period}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Amount</p>
                    <p className="font-semibold">{formatRupees(task.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Status</p>
                    <p className="font-semibold text-purple-600">Approval pending</p>
                  </div>
                </div>
              </div>

              {/* Level 1 Review Context */}
              {level1Check && (
                <div className="bg-gray-50 rounded-lg shadow p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    📋 Level 1 Check Summary
                  </h3>

                  <div className="space-y-4">
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <p className="text-sm font-semibold text-gray-700">
                        Checked by: <span className="font-bold">{level1Check.checker_name}</span>
                      </p>
                    </div>

                    {level1Check.notes && (
                      <div className="bg-white p-4 rounded border border-gray-200">
                        <p className="text-sm font-semibold text-gray-700 mb-2">L1 Notes:</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {level1Check.notes}
                        </p>
                      </div>
                    )}

                    <div className="bg-white p-3 rounded border border-gray-200">
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        Verified: {level1Verifications.size} subtasks
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Approval Confirmation */}
              <div className="bg-purple-50 rounded-lg shadow p-6 border-2 border-purple-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">✓ Approval</h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-white rounded border-2 border-purple-200">
                    <input
                      type="checkbox"
                      checked={confirmApproval}
                      onChange={(e) => setConfirmApproval(e.target.checked)}
                      className="mt-1 w-5 h-5 text-purple-600 rounded cursor-pointer"
                    />
                    <label className="cursor-pointer flex-1">
                      <p className="font-semibold text-gray-900">
                        I have reviewed the Level 1 check and approve this task
                      </p>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Optional Notes
                    </label>
                    <textarea
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      placeholder="Any final notes..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-20"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="space-y-3">
                  <button
                    onClick={handleApprove}
                    disabled={isSaving || !confirmApproval}
                    className={`w-full py-3 rounded font-semibold text-white transition ${
                      confirmApproval
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    ✓ Approve & Complete
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleReject}
                      disabled={isSaving}
                      className="py-3 bg-red-600 text-white rounded font-semibold hover:bg-red-700 disabled:opacity-50"
                    >
                      ✗ Reject
                    </button>

                    <div className="relative">
                      <button
                        onClick={() => setShowReassignDropdown(!showReassignDropdown)}
                        className="w-full py-3 bg-amber-600 text-white rounded font-semibold hover:bg-amber-700"
                      >
                        ↻ Reassign
                      </button>

                      {showReassignDropdown && (
                        <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded shadow-lg z-10">
                          {employees
                            .filter((e) => e.id !== approval.checker_id)
                            .map((emp) => (
                              <button
                                key={emp.id}
                                onClick={() => handleReassign(emp.id)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b last:border-0 text-gray-900"
                              >
                                {emp.name}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2 bg-white rounded-lg shadow p-8">
              <p className="text-center text-gray-500">Select a pending approval</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
