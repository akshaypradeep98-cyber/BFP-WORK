"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavbarRefined from "@/components/NavbarRefined";

interface Subtask {
  id: number;
  task_id: number;
  title: string;
  done: boolean;
  seconds: number;
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

interface Check {
  id: number;
  task_id: number;
  checker_id: number;
  check_level: number;
  status: string;
  notes: string;
  created_at: string;
}

interface PendingCheck {
  id: number;
  task_id: number;
  checker_id: number;
  check_level: number;
  status: string;
  created_at: string;
  task_title: string;
  client_name: string;
  worker_name: string;
}

export default function Level1CheckPage() {
  const router = useRouter();

  // State
  const [pendingChecks, setPendingChecks] = useState<PendingCheck[]>([]);
  const [selectedCheckId, setSelectedCheckId] = useState<number | null>(null);
  const [check, setCheck] = useState<Check | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [worker, setWorker] = useState<Employee | null>(null);
  const [verifications, setVerifications] = useState<Set<number>>(new Set());
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showReassignDropdown, setShowReassignDropdown] = useState(false);
  const [reviewers, setReviewers] = useState<Employee[]>([]);
  const [level2CheckerId, setLevel2CheckerId] = useState<number | null>(null);

  // Load pending checks
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
        // Get all checks from database
        const response = await fetch("/api/checks/level1");
        if (response.ok) {
          const data = await response.json();
          setPendingChecks(data || []);
        }

        // Get employees for reassignment, and managers/admins for Level 2
        const [empResponse, reviewerResponse] = await Promise.all([
          fetch("/api/employees/directory"),
          fetch("/api/employees/directory?role=reviewer"),
        ]);
        if (empResponse.ok) {
          const empData = await empResponse.json();
          setEmployees(empData || []);
        }
        if (reviewerResponse.ok) {
          setReviewers((await reviewerResponse.json()) || []);
        }
      } catch (error) {
        console.error("Error loading:", error);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [router]);

  // Load check details when selected
  useEffect(() => {
    if (!selectedCheckId) return;

    const load = async () => {
      setIsSaving(true);
      try {
        // Get check
        const checkRes = await fetch(`/api/checks/level1/${selectedCheckId}`);
        if (!checkRes.ok) {
          const error = await checkRes.json();
          alert(`Error loading check: ${error.error}`);
          return;
        }
        const checkData = await checkRes.json();
        setCheck(checkData);

        // Get task
        const taskRes = await fetch(`/api/tasks/${checkData.task_id}`);
        if (taskRes.ok) {
          const taskData = await taskRes.json();
          setTask(taskData);
          setSubtasks(taskData.subtasks || []);
        }

        // Get client
        if (checkData.task) {
          const clientRes = await fetch(`/api/clients/${checkData.task.client_id}`);
          if (clientRes.ok) {
            const clientData = await clientRes.json();
            setClient(clientData);
          }

          // Get worker (name only, via the directory — RLS limits
          // GET /api/employees/:id to admin/manager or the employee's own row)
          const directoryRes = await fetch("/api/employees/directory");
          if (directoryRes.ok) {
            const directory: Employee[] = await directoryRes.json();
            const workerEntry = directory.find((e) => e.id === checkData.task.employee_id);
            if (workerEntry) setWorker(workerEntry);
          }
        }

        // Get verifications
        const verRes = await fetch(`/api/subtask-verifications?task_check_id=${selectedCheckId}`);
        if (verRes.ok) {
          const verData = await verRes.json();
          const verSet = new Set<number>(verData.map((v: any) => v.subtask_id as number));
          setVerifications(verSet);
        }

        setNotes(checkData.notes || "");
      } catch (error) {
        console.error("Error loading check details:", error);
        alert("Error loading check details");
      } finally {
        setIsSaving(false);
      }
    };

    load();
  }, [selectedCheckId]);

  // Only steps the staff member ticked as done can be verified
  const doneSubtasks = subtasks.filter((s) => s.done);
  const notDoneCount = subtasks.length - doneSubtasks.length;
  const verifiedCount = doneSubtasks.filter((s) => verifications.has(s.id)).length;
  const allDoneVerified = doneSubtasks.length > 0 && verifiedCount === doneSubtasks.length;

  // Toggle verification
  const handleVerifySubtask = async (subtaskId: number) => {
    if (!selectedCheckId || !check) return;
    if (!subtasks.find((s) => s.id === subtaskId)?.done) return;

    const newVerifications = new Set(verifications);
    const shouldAdd = !newVerifications.has(subtaskId);

    if (shouldAdd) {
      newVerifications.add(subtaskId);
    } else {
      newVerifications.delete(subtaskId);
    }

    // Optimistically update UI
    setVerifications(newVerifications);

    // Save to server
    try {
      const response = await fetch("/api/subtask-verifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subtask_id: subtaskId,
          task_check_id: selectedCheckId,
          verified: shouldAdd,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Couldn't save the verification");
      }
    } catch (error) {
      console.error("Error saving verification:", error);
      alert(error instanceof Error ? error.message : "Couldn't save the verification");
      // Revert on error
      setVerifications(verifications);
    }
  };

  // Save notes
  const handleSaveNotes = async () => {
    if (!selectedCheckId) return;

    setIsSaving(true);
    try {
      await fetch(`/api/checks/level1/${selectedCheckId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_notes",
          notes,
        }),
      });
      alert("Notes saved!");
    } catch (error) {
      console.error("Error saving notes:", error);
      alert("Error saving notes");
    } finally {
      setIsSaving(false);
    }
  };

  // Approve
  const handleApprove = async () => {
    if (!selectedCheckId || !allDoneVerified) {
      alert("Please verify every step the staff member ticked before approving");
      return;
    }
    if (!level2CheckerId) {
      alert("Pick who will do the Level 2 check");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/checks/level1/${selectedCheckId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          notes,
          level2_checker_id: level2CheckerId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const l2Name = reviewers.find((r) => r.id === level2CheckerId)?.name;
      alert(`Check approved! Task sent to ${l2Name ?? "the Level 2 checker"} for Level 2`);
      setSelectedCheckId(null);
      setLevel2CheckerId(null);
      // Refresh pending checks
      const res = await fetch("/api/checks/level1");
      if (res.ok) setPendingChecks(await res.json());
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Reject
  const handleReject = async () => {
    if (!selectedCheckId) return;

    if (!confirm("Send this task back to the worker for rework?")) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/checks/level1/${selectedCheckId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      alert("Check rejected. Task sent back to worker");
      setSelectedCheckId(null);
      // Refresh
      const res = await fetch("/api/checks/level1");
      if (res.ok) setPendingChecks(await res.json());
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Reassign
  const handleReassign = async (newCheckerId: number) => {
    if (!selectedCheckId) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/checks/level1/${selectedCheckId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reassign",
          new_checker_id: newCheckerId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      alert("Check reassigned!");
      setSelectedCheckId(null);
      setShowReassignDropdown(false);
      // Refresh
      const res = await fetch("/api/checks/level1");
      if (res.ok) setPendingChecks(await res.json());
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
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
      <NavbarRefined />
      {/* Header */}
      <div className="bg-[#1C3350] text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Level 1 Checking</h1>
            <p className="text-sm text-gray-300 mt-1">Verify work completed</p>
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
          {/* Sidebar - Pending Checks */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Pending Checks ({pendingChecks.length})
            </h2>
            {pendingChecks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No pending checks</p>
            ) : (
              <div className="space-y-2">
                {pendingChecks.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCheckId(c.id)}
                    className={`w-full text-left p-3 rounded border-2 transition ${
                      selectedCheckId === c.id
                        ? "border-[#1C3350] bg-blue-50"
                        : "border-gray-200 hover:border-[#1C3350]"
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{c.task_title}</p>
                    <p className="text-sm text-gray-600">{c.client_name}</p>
                    <p className="text-xs text-gray-500">Worker: {c.worker_name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main Content */}
          {selectedCheckId && check && task ? (
            <div className="lg:col-span-2 space-y-6">
              {/* Header Card */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
                    <p className="text-gray-600 mt-1">{client?.name}</p>
                  </div>
                  <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded font-semibold text-sm">
                    Level 1 check
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Period</p>
                    <p className="font-semibold">FY {task.tax_period}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Amount</p>
                    <p className="font-semibold">{formatRupees(task.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Worker</p>
                    <p className="font-semibold">{worker?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Progress</p>
                    <p className="font-semibold text-blue-600">
                      {verifiedCount}/{doneSubtasks.length} verified
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all"
                    style={{
                      width: `${
                        doneSubtasks.length > 0 ? (verifiedCount / doneSubtasks.length) * 100 : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Subtasks Verification */}
              <div className="bg-blue-50 rounded-lg shadow p-6 border-2 border-blue-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  ✔ Verify Subtasks
                </h3>
                {notDoneCount > 0 && (
                  <p className="mb-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                    {notDoneCount} step{notDoneCount === 1 ? " wasn't" : "s weren't"} ticked as done by the staff
                    member, so {notDoneCount === 1 ? "it" : "they"} can&apos;t be verified. Reject the check if
                    {notDoneCount === 1 ? " it's" : " they're"} needed.
                  </p>
                )}
                <div className="space-y-2">
                  {subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className={`flex items-start gap-3 p-3 rounded border ${
                        subtask.done
                          ? "bg-white border-blue-200 hover:bg-blue-50"
                          : "bg-amber-50 border-amber-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={subtask.done && verifications.has(subtask.id)}
                        onChange={() => handleVerifySubtask(subtask.id)}
                        disabled={!subtask.done}
                        title={subtask.done ? undefined : "Not ticked as done by the staff member"}
                        className={`mt-1 w-5 h-5 text-blue-600 rounded ${
                          subtask.done ? "cursor-pointer" : "cursor-not-allowed"
                        }`}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{subtask.title}</p>
                        <p className="text-sm text-gray-600">
                          Time: {formatTime(subtask.seconds)}
                        </p>
                      </div>
                      {!subtask.done ? (
                        <span className="text-xs text-gray-500 font-semibold whitespace-nowrap">Not done by staff</span>
                      ) : verifications.has(subtask.id) ? (
                        <span className="text-xs text-green-600 font-semibold">✓ Verified</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📝 Your Notes</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detailed notes about the work quality, any issues, etc."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350] min-h-24"
                />
                <button
                  onClick={handleSaveNotes}
                  disabled={isSaving}
                  className="mt-3 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Notes"}
                </button>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Level 2 checker
                    </label>
                    <select
                      value={level2CheckerId ?? ""}
                      onChange={(e) => setLevel2CheckerId(e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
                    >
                      <option value="">Select a manager or admin...</option>
                      {reviewers
                        .filter((r) => r.id !== check.checker_id)
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      You can&apos;t do the Level 2 check on a task you checked at Level 1.
                    </p>
                  </div>
                  <button
                    onClick={handleApprove}
                    disabled={isSaving || !allDoneVerified || !level2CheckerId}
                    className={`w-full py-3 rounded font-semibold text-white transition ${
                      allDoneVerified && level2CheckerId
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    ✓ Approve & Send to Level 2
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
                            .filter((e) => e.id !== check.checker_id)
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
              <p className="text-center text-gray-500">Select a pending check to review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
