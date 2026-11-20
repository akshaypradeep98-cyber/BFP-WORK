"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import NavbarRefined from "@/components/NavbarRefined";
import Link from "next/link";
import SubtaskChecklist from "./components/SubtaskChecklist";
import PaymentsPanel from "./components/PaymentsPanel";
import WhatsAppNotificationModal from "@/components/WhatsAppNotificationModal";
import { formatTime, getTotalTimeSeconds } from "@/lib/taskTemplates";
import { CHECK_RESULTS, canCompleteTask, effectiveCheckStatus, getTaxPeriods, isChecklistLocked } from "@/lib/utils";

const TAX_PERIODS = getTaxPeriods();

interface Employee {
  id: number;
  name: string;
  avatar_color?: string;
}

interface Client {
  id: number;
  name: string;
}

interface Division {
  id: number;
  name: string;
  color: string;
}

interface Subtask {
  id: number;
  task_id: number;
  title: string;
  done: boolean;
  seconds: number;
  notes: string;
  sort_order: number;
}

interface Task {
  id: number;
  title: string;
  client_id: number;
  employee_id: number;
  division_id: number;
  due_date: string;
  amount: number;
  expense: number;
  status: string;
  tax_period?: string;
  check_status?: string;
  subtasks: Subtask[];
}

interface TaskCheck {
  id: number;
  task_id: number;
  checker_id: number;
  checker_name: string;
  check_level: number;
  status: string;
  notes: string;
  created_at: string;
  approved_at: string | null;
  resend_level?: number | null;
}

// Where a sent-back task goes when resent: Level 2 only if the Level 2
// checker who rejected it chose that, otherwise a fresh Level 1 check.
function getResendLevel(checks: TaskCheck[]): 1 | 2 {
  const lastRejection = [...checks].reverse().find((c) => c.status === "rejected");
  return lastRejection?.check_level === 2 && lastRejection.resend_level === 2 ? 2 : 1;
}

const STATUS_COLORS: Record<string, string> = {
  todo: "bg-gray-100 text-gray-800",
  prog: "bg-amber-100 text-amber-800",
  done: "bg-green-100 text-green-800",
  completed: "bg-slate-200 text-slate-700",
};

const STATUS_LABELS: Record<string, string> = {
  todo: "To do",
  prog: "In progress",
  done: "Done",
};

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [taskChecks, setTaskChecks] = useState<TaskCheck[]>([]);
  const [verifiedIds, setVerifiedIds] = useState<Set<number>>(new Set());
  const [isCompleting, setIsCompleting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [reviewers, setReviewers] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSubtasks, setHasSubtasks] = useState(true);
  const [error, setError] = useState("");
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppData, setWhatsAppData] = useState({
    employeeName: "",
    taskTitle: "",
    clientName: "",
    dueDate: "",
    assignerName: "",
  });
  const [currentUserName, setCurrentUserName] = useState("");
  const [userClassification, setUserClassification] = useState<string>("");

  // Checker assignment state
  const [showCheckerAssignment, setShowCheckerAssignment] = useState(false);
  const [checkerAssignmentOption, setCheckerAssignmentOption] = useState<"now" | "later" | null>(null);
  const [selectedChecker, setSelectedChecker] = useState<number | null>(null);
  const [isAssigningChecker, setIsAssigningChecker] = useState(false);
  const [checkerAssignmentMessage, setCheckerAssignmentMessage] = useState("");

  // Check auth and fetch data
  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const employeeName = document.cookie
        .split("; ")
        .find((row) => row.startsWith("employee_name="))
        ?.split("=")[1];

      const classification = document.cookie
        .split("; ")
        .find((row) => row.startsWith("employee_classification="))
        ?.split("=")[1];

      if (!employeeName) {
        router.push("/login");
        return;
      }

      setCurrentUserName(decodeURIComponent(employeeName));
      setUserClassification(classification || "");

      await Promise.all([
        fetchTask(),
        fetchTaskChecks(),
        fetchEmployees(),
        fetchClients(),
        fetchDivisions(),
      ]);
    };

    checkAuthAndFetch();
  }, [router]);

  const fetchTask = async () => {
    try {
      const employeeId = document.cookie
        .split("; ")
        .find((row) => row.startsWith("employee_id="))
        ?.split("=")[1];

      const classification = document.cookie
        .split("; ")
        .find((row) => row.startsWith("employee_classification="))
        ?.split("=")[1];

      const response = await fetch(`/api/tasks/${taskId}`);
      if (!response.ok) throw new Error("Failed to fetch task");
      const data = await response.json();

      // Check access control: only assigned employee or admin can view
      if (
        classification !== "admin" &&
        data.employee_id !== parseInt(employeeId || "0")
      ) {
        setError("You do not have access to this task");
        setIsLoading(false);
        return;
      }

      setTask(data);
      setHasSubtasks(data.subtasks && data.subtasks.length > 0);
    } catch (error) {
      console.error("Error fetching task:", error);
      setError("Failed to fetch task");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTaskChecks = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/checks`);
      if (!response.ok) throw new Error("Failed to fetch checker notes");
      const data: TaskCheck[] = await response.json();
      setTaskChecks(data);

      // Steps the latest approved Level 1 check verified stay frozen after
      // Level 2 approval; everything else can still be finished.
      const lastL1 = [...data].reverse().find((c) => c.check_level === 1 && c.status === "approved");
      if (lastL1) {
        const verRes = await fetch(`/api/subtask-verifications?task_check_id=${lastL1.id}`);
        if (verRes.ok) {
          const rows: { subtask_id: number; verified: boolean }[] = await verRes.json();
          setVerifiedIds(new Set(rows.filter((r) => r.verified).map((r) => r.subtask_id)));
        }
      } else {
        setVerifiedIds(new Set());
      }
    } catch (error) {
      console.error("Error fetching checker notes:", error);
    }
  };

  const handleCompleteTask = async () => {
    if (!task) return;
    if (!window.confirm("Mark this task as completed? It will be closed and leave the task list.")) return;

    setIsCompleting(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to complete the task");
      }
      const updated = await response.json();
      setTask({ ...task, ...updated, subtasks: task.subtasks });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to complete the task");
    } finally {
      setIsCompleting(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const [response, reviewerResponse] = await Promise.all([
        fetch("/api/employees/directory"),
        fetch("/api/employees/directory?role=reviewer"),
      ]);
      if (!response.ok) throw new Error("Failed to fetch employees");
      setEmployees(await response.json());
      if (reviewerResponse.ok) setReviewers(await reviewerResponse.json());
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      if (!response.ok) throw new Error("Failed to fetch clients");
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const fetchDivisions = async () => {
    try {
      const response = await fetch("/api/divisions");
      if (!response.ok) throw new Error("Failed to fetch divisions");
      const data = await response.json();
      setDivisions(data);
    } catch (error) {
      console.error("Error fetching divisions:", error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!task) return;

    // If marking as done, only allow admins to assign checkers
    if (newStatus === "done") {
      if (userClassification !== "admin") {
        alert("Only admins can mark tasks as done and assign checkers");
        return;
      }
      setShowCheckerAssignment(true);
      setCheckerAssignmentOption(null);
      setSelectedChecker(null);
      return;
    }

    // Otherwise, update status directly
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update task");
      const updated = await response.json();
      setTask(updated);
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const handleCompleteTaskWithChecker = async (assignNow: boolean) => {
    if (!task) return;

    const isResend = effectiveCheckStatus(task.check_status, taskChecks) === "rejected";
    const resendLevel = isResend ? getResendLevel(taskChecks) : 1;

    setIsAssigningChecker(true);
    try {
      const data: any = {
        status: "done",
        check_status: assignNow
          ? resendLevel === 2
            ? "checking_level2"
            : "checking_level1"
          : "waiting_for_checker",
      };

      if (assignNow && selectedChecker) {
        data.checker_id = selectedChecker;
      }

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to update task");
      }
      const updated = await response.json();
      setTask(updated);
      await fetchTaskChecks();

      if (assignNow && selectedChecker) {
        const checker = employees.find((e) => e.id === selectedChecker);
        setCheckerAssignmentMessage(
          `✓ Sent for Level ${resendLevel} check with ${checker?.name}`
        );
      } else {
        setCheckerAssignmentMessage("⚠️ Task marked done. Assign a checker below.");
      }

      setShowCheckerAssignment(false);
      setCheckerAssignmentOption(null);
      setSelectedChecker(null);

      setTimeout(() => setCheckerAssignmentMessage(""), 4000);
    } catch (error) {
      console.error("Error completing task:", error);
      alert(error instanceof Error ? error.message : "Error completing task");
    } finally {
      setIsAssigningChecker(false);
    }
  };

  const handleAssignCheckerLater = async (checkerId: number) => {
    if (!task) return;

    setIsAssigningChecker(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          check_status: "checking_level1",
          checker_id: checkerId,
        }),
      });

      if (!response.ok) throw new Error("Failed to assign checker");
      const updated = await response.json();
      setTask(updated);
      await fetchTaskChecks();

      const checker = employees.find((e) => e.id === checkerId);
      setCheckerAssignmentMessage(`✓ Checker assigned to ${checker?.name}`);

      setTimeout(() => setCheckerAssignmentMessage(""), 3000);
    } catch (error) {
      console.error("Error assigning checker:", error);
      alert("Error assigning checker");
    } finally {
      setIsAssigningChecker(false);
    }
  };

  const handleReassign = async (newEmployeeId: number) => {
    if (userClassification !== "admin") {
      alert("Only admins can reassign tasks");
      return;
    }

    if (!task || newEmployeeId === 0 || !newEmployeeId) {
      console.log("[handleReassign] Invalid employee ID:", newEmployeeId);
      return;
    }

    try {
      console.log("[handleReassign] Reassigning task", taskId, "to employee", newEmployeeId);

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: newEmployeeId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update task");
      }

      const updated = await response.json();
      console.log("[handleReassign] Task updated successfully:", updated);
      setTask(updated);

      // Get new assigned employee
      const newEmployee = employees.find((e) => e.id === newEmployeeId);
      const clientName = clients.find((c) => c.id === task.client_id)?.name || "Unknown Client";

      console.log("[handleReassign] New employee:", newEmployee?.name, "Client:", clientName);

      if (newEmployee) {
        // Show WhatsApp notification
        setWhatsAppData({
          employeeName: newEmployee.name,
          taskTitle: task.title,
          clientName: clientName,
          dueDate: task.due_date,
          assignerName: currentUserName,
        });
        setShowWhatsAppModal(true);
      }
    } catch (error) {
      console.error("[handleReassign] Error:", error);
      alert(`Failed to reassign task: ${error}`);
    }
  };

  const handleTaxPeriodChange = async (newTaxPeriod: string) => {
    if (!task) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tax_period: newTaxPeriod }),
      });

      if (!response.ok) throw new Error("Failed to update tax period");
      const updated = await response.json();
      setTask(updated);
    } catch (error) {
      console.error("Error updating tax period:", error);
    }
  };

  const handleGenerateChecklist = async () => {
    if (!task) return;

    try {
      setError("");
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate-checklist" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate checklist");
      }

      await fetchTask();
    } catch (err: any) {
      console.error("Error generating checklist:", err);
      setError(err.message);
    }
  };

  const handleSendToLevel1Check = () => {
    if (!task) return;

    // On a resend, default the picker to whoever last checked at the level
    // it's going to, so the user can keep them or pick someone else.
    const level = getResendLevel(taskChecks);
    const lastChecker =
      [...taskChecks]
        .reverse()
        .find((c) => c.check_level === level && c.status !== "reassigned")?.checker_id ?? null;

    setSelectedChecker(lastChecker);
    setCheckerAssignmentOption(lastChecker ? "now" : null);
    setShowCheckerAssignment(true);
  };

  const handleSubtasksChange = (updatedSubtasks: Subtask[]) => {
    if (task) {
      setTask({ ...task, subtasks: updatedSubtasks });
    }
  };

  const handleTaskUpdate = (amount: number, expense: number) => {
    if (task) {
      setTask({ ...task, amount, expense });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link
            href="/tasks"
            className="text-blue-600 hover:underline text-sm mb-4 inline-block"
          >
            ← Back to Tasks
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 font-semibold">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link
            href="/tasks"
            className="text-blue-600 hover:underline text-sm mb-4 inline-block"
          >
            ← Back to Tasks
          </Link>
          <p className="text-gray-600">Task not found</p>
        </div>
      </div>
    );
  }

  const client = clients.find((c) => c.id === task.client_id);
  const employee = employees.find((e) => e.id === task.employee_id);
  const division = divisions.find((d) => d.id === task.division_id);
  const totalSeconds = getTotalTimeSeconds(task.subtasks);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const checkStatus = effectiveCheckStatus(task.check_status, taskChecks);
  const isCompleted = task.status === "completed";
  const isApproved = checkStatus === "approved" && !isCompleted;
  const checklistLocked = isCompleted || (isChecklistLocked(checkStatus) && !isApproved);
  const readyToComplete = isApproved && canCompleteTask(checkStatus, task.subtasks);
  const resendLevel = checkStatus === "rejected" ? getResendLevel(taskChecks) : 1;
  // A direct Level 2 resend can only go to a manager/admin who didn't do
  // the Level 1 check.
  const lastLevel1Approver = [...taskChecks]
    .reverse()
    .find((c) => c.check_level === 1 && c.status === "approved")?.checker_id;
  const checkerOptions =
    resendLevel === 2 ? reviewers.filter((r) => r.id !== lastLevel1Approver) : employees;
  const openCheck = [...taskChecks].reverse().find((c) => c.status === "in_progress");
  const canSendForCheck = !isCompleted && (task.status !== "done" || checkStatus === "rejected");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavbarRefined />
      {/* Header */}
      <div className="bg-primary-600 dark:bg-primary-800 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link
            href="/tasks"
            className="text-white hover:opacity-80 transition text-sm mb-4 inline-block"
          >
            ← Back to Tasks
          </Link>
          <h1 className="text-3xl font-bold">{task.title}</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Task Info */}
        <div className="bg-white dark:bg-gray-700 rounded-md shadow border border-gray-200 dark:border-gray-600 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
            {/* Client */}
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Client</p>
              <p className="font-semibold text-gray-900 dark:text-white text-lg">
                {client?.name || "—"}
              </p>
            </div>

            {/* Division */}
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Division</p>
              {division ? (
                <span
                  className="inline-block px-3 py-1 rounded-md text-white text-sm font-semibold"
                  style={{ backgroundColor: division.color }}
                >
                  {division.name}
                </span>
              ) : (
                <p className="text-gray-400">—</p>
              )}
            </div>

            {/* Assigned to */}
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Assigned to</p>
              {employee ? (
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                    style={{ backgroundColor: employee.avatar_color || "#6366f1" }}
                  >
                    {getInitials(employee.name)}
                  </div>
                  <span className="text-gray-900 dark:text-white font-medium">{employee.name}</span>
                </div>
              ) : (
                <p className="text-gray-400">—</p>
              )}
            </div>

            {/* Due Date */}
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Due Date</p>
              <p className="font-semibold text-gray-900 dark:text-white text-lg">
                {task.due_date
                  ? new Date(task.due_date).toLocaleDateString("en-IN")
                  : "—"}
              </p>
            </div>

            {/* Tax Period */}
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Tax Period</p>
              <select
                value={task.tax_period || TAX_PERIODS[10]}
                onChange={(e) => handleTaxPeriodChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-400 dark:bg-gray-600 dark:text-white text-sm font-semibold"
              >
                {TAX_PERIODS.map((period) => (
                  <option key={period} value={period}>
                    {period}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-600">
            {/* Status dropdown - Admin only for marking done */}
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-2">Status</label>
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={userClassification !== "admin" && (task.status === "done" || task.status === "completed")}
                className={`w-full px-3 py-2 rounded-md font-semibold text-sm border-0 focus:outline-none focus:ring-2 focus:ring-accent-400 ${
                  userClassification !== "admin" && (task.status === "done" || task.status === "completed") ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                } ${
                  STATUS_COLORS[task.status] || STATUS_COLORS["todo"]
                } dark:text-white`}
              >
                <option value="todo">To do</option>
                <option value="prog">In progress</option>
                {userClassification === "admin" && <option value="done">Done</option>}
                {task.status === "completed" && (
                  <option value="completed" disabled>
                    Completed
                  </option>
                )}
              </select>
              {userClassification !== "admin" && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Only admins can mark tasks as done
                </p>
              )}
            </div>

            {/* Reassign dropdown - Admin only */}
            {userClassification === "admin" ? (
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-2">Reassign</label>
                <select
                  value={task.employee_id || ""}
                  onChange={(e) => handleReassign(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-400 text-sm cursor-pointer dark:bg-gray-600 dark:text-white"
                >
                  <option value="">Unassigned</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-2">Reassign</label>
                <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400">
                  Admin only
                </div>
              </div>
            )}

            {/* Time logged */}
            {totalSeconds > 0 && (
              <div className="flex items-end">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-2">
                    Time Logged
                  </label>
                  <p className="font-semibold text-gray-900 dark:text-white text-lg">
                    {formatTime(totalSeconds)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Checker Assignment Message */}
        {checkerAssignmentMessage && (
          <div className={`rounded-md p-4 ${
            checkerAssignmentMessage.includes("✓")
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}>
            {checkerAssignmentMessage}
          </div>
        )}

        {/* Checker Assignment Modal */}
        {showCheckerAssignment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4 dark:bg-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {checkStatus === "rejected" ? "Resend for Checking" : "Mark Task as Done"}
              </h3>

              <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
                {checkStatus === "rejected" && resendLevel === 2
                  ? "The Level 2 checker asked for this to come straight back to Level 2. Keep the same checker or pick a different one."
                  : checkStatus === "rejected"
                  ? "This goes to a Level 1 check. Keep the same checker or pick a different one, or decide later."
                  : "Would you like to assign a checker now, or do it later?"}
              </p>

              {/* Radio Options */}
              <div className="space-y-4 mb-6">
                {/* Option 1: Assign Now */}
                <label className="flex items-start gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer">
                  <input
                    type="radio"
                    checked={checkerAssignmentOption === "now"}
                    onChange={() => setCheckerAssignmentOption("now")}
                    className="mt-1 w-4 h-4"
                  />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Assign a checker now
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Choose who will check this task
                    </p>
                  </div>
                </label>

                {/* Option 2: Assign Later */}
                {resendLevel === 1 && (
                <label className="flex items-start gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer">
                  <input
                    type="radio"
                    checked={checkerAssignmentOption === "later"}
                    onChange={() => setCheckerAssignmentOption("later")}
                    className="mt-1 w-4 h-4"
                  />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      I&apos;ll assign later
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Mark as done now, assign checker later
                    </p>
                  </div>
                </label>
                )}
              </div>

              {/* Checker Dropdown (shown when option 1 selected) */}
              {checkerAssignmentOption === "now" && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {resendLevel === 2 ? "Level 2 checker" : "Who should check this?"}
                  </label>
                  <select
                    value={selectedChecker || ""}
                    onChange={(e) => setSelectedChecker(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                  >
                    <option value="">Select a checker...</option>
                    {checkerOptions.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCheckerAssignment(false);
                    setCheckerAssignmentOption(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (checkerAssignmentOption === "now") {
                      if (!selectedChecker) {
                        alert("Please select a checker");
                        return;
                      }
                      handleCompleteTaskWithChecker(true);
                    } else if (checkerAssignmentOption === "later") {
                      handleCompleteTaskWithChecker(false);
                    }
                  }}
                  disabled={isAssigningChecker}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
                >
                  {isAssigningChecker ? "Processing..." : "Continue"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rejected by checker — needs rework */}
        {checkStatus === "rejected" && (() => {
          const rejections = taskChecks.filter((c) => c.status === "rejected");
          const latest = rejections[rejections.length - 1];
          return (
            <div className="bg-red-50 dark:bg-red-900 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-start gap-3">
                <span className="text-xl">✗</span>
                <div className="flex-1">
                  <p className="font-semibold text-red-800 dark:text-red-200">
                    Sent back for rework
                    {latest ? ` by ${latest.checker_name} (Level ${latest.check_level} check)` : ""}
                  </p>
                  {latest?.notes && (
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1 whitespace-pre-wrap">
                      {latest.notes}
                    </p>
                  )}
                  <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                    Fix the checklist and send it for checking again below.{" "}
                    {resendLevel === 2
                      ? `The Level 2 checker asked for it to come straight back to Level 2${
                          latest ? ` (${latest.checker_name})` : ""
                        } — no Level 1 check needed.`
                      : latest?.check_level === 2
                      ? "The Level 2 checker asked for the full check again, starting at Level 1."
                      : ""}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Currently with a checker */}
        {(checkStatus === "checking_level1" || checkStatus === "checking_level2") && (() => {
          const level = checkStatus === "checking_level1" ? 1 : 2;
          const active = [...taskChecks]
            .reverse()
            .find((c) => c.check_level === level && c.status === "in_progress");
          return (
            <div className="bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-500 p-4 rounded">
              <p className="font-semibold text-blue-800 dark:text-blue-200">
                With {active?.checker_name ?? "a checker"} for Level {level} check
              </p>
              {level === 2 && (
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Level 1 check approved.
                </p>
              )}
            </div>
          );
        })()}

        {/* Fully approved */}
        {checkStatus === "approved" && (() => {
          const finalCheck = [...taskChecks]
            .reverse()
            .find((c) => c.check_level === 2 && c.status === "approved");
          return (
            <div className="bg-green-50 dark:bg-green-900 border-l-4 border-green-500 p-4 rounded">
              <p className="font-semibold text-green-800 dark:text-green-200">
                ✓ Approved{finalCheck ? ` by ${finalCheck.checker_name} at Level 2` : ""}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Both checking levels are complete.
              </p>
            </div>
          );
        })()}

        {/* Checker Not Assigned Warning */}
        {task.status === "done" && checkStatus === "waiting_for_checker" && (
          <div className="bg-red-50 dark:bg-red-900 border-l-4 border-red-500 p-4 rounded">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div className="flex-1">
                <p className="font-semibold text-red-800 dark:text-red-200">
                  No checker assigned
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Assign a checker below to start the verification process
                </p>
              </div>
            </div>

            {/* Assign Checker Section */}
            <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-700">
              <label className="block text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
                Select a checker:
              </label>
              <div className="flex gap-2">
                <select
                  onChange={(e) => {
                    const checkerId = parseInt(e.target.value);
                    if (checkerId) {
                      handleAssignCheckerLater(checkerId);
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-600 dark:text-white"
                >
                  <option value="">Choose a team member...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Check history - every Level 1/2 round, its outcome and notes */}
        {taskChecks.length > 0 && (
          <div className="bg-white dark:bg-gray-700 rounded-md shadow border border-gray-200 dark:border-gray-600 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">📝 Check History</h2>
            <div className="space-y-3">
              {taskChecks.map((c) => {
                const result = CHECK_RESULTS[c.status];
                const date = new Date(c.approved_at || c.created_at).toLocaleDateString("en-IN");
                return (
                  <div
                    key={c.id}
                    className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        Level {c.check_level} — {c.checker_name}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {c.approved_at ? "Approved" : "Assigned"} {date}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            result?.className ?? "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {result?.label ?? c.status}
                        </span>
                      </div>
                    </div>
                    {c.status === "rejected" && c.check_level === 2 && (
                      <p className="text-xs font-semibold text-red-700 dark:text-red-300 mt-2">
                        Resend goes to: {c.resend_level === 2 ? "Level 2 directly" : "Level 1 check"}
                      </p>
                    )}
                    {c.notes && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap">
                        {c.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Payments Section */}
        <div className="bg-white dark:bg-gray-700 rounded-md shadow border border-gray-200 dark:border-gray-600 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">💰 Payments</h2>
          <PaymentsPanel
            taskId={task.id}
            taskAmount={task.amount}
            taskExpense={task.expense}
            onTaskUpdate={handleTaskUpdate}
          />
        </div>

        {/* Subtasks Section */}
        <div className="bg-white dark:bg-gray-700 rounded-md shadow border border-gray-200 dark:border-gray-600 p-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">✓ Checklist</h2>
            {!hasSubtasks && !checklistLocked && (
              <button
                onClick={handleGenerateChecklist}
                className="px-4 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-md hover:bg-primary-700 dark:hover:bg-primary-800 transition text-sm font-semibold whitespace-nowrap"
              >
                Generate checklist
              </button>
            )}
          </div>

          <SubtaskChecklist
            taskId={task.id}
            taskTitle={task.title}
            subtasks={task.subtasks}
            onSubtasksChange={handleSubtasksChange}
            locked={checklistLocked}
            frozenIds={isApproved ? verifiedIds : undefined}
            lockMessage={isCompleted ? "✓ This task is completed and closed." : undefined}
          />

          {/* Send for Level 1 Check */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
            {!canSendForCheck ? (
              <p
                className={`text-sm font-semibold ${
                  checkStatus === "approved"
                    ? "text-green-700 dark:text-green-400"
                    : "text-blue-700 dark:text-blue-300"
                }`}
              >
                {isCompleted
                  ? "✓ Task completed"
                  : checkStatus === "approved"
                  ? "✓ Approved — both checking levels complete"
                  : checkStatus === "checking_level1" || checkStatus === "checking_level2"
                  ? `With ${openCheck?.checker_name ?? "a checker"} for Level ${
                      checkStatus === "checking_level1" ? 1 : 2
                    } check`
                  : checkStatus === "waiting_for_checker"
                  ? "Waiting for a checker to be assigned"
                  : "✓ Sent for checking"}
              </p>
            ) : null}

            {isApproved && (
              <div className="mt-4">
                {readyToComplete ? (
                  <button
                    onClick={handleCompleteTask}
                    disabled={isCompleting}
                    className="px-5 py-2 rounded-md font-semibold text-sm transition bg-primary-600 dark:bg-primary-700 text-white hover:bg-primary-700 dark:hover:bg-primary-800 disabled:opacity-50"
                  >
                    {isCompleting ? "Completing..." : "✓ Mark Task Completed"}
                  </button>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tick off the remaining{" "}
                    {(task.subtasks || []).filter((s) => !s.done).length} step(s) above to complete this task.
                  </p>
                )}
              </div>
            )}

            {canSendForCheck && (
              <button
                onClick={handleSendToLevel1Check}
                className="px-5 py-2 rounded-md font-semibold text-sm transition bg-success-500 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-800"
              >
                {checkStatus === "rejected" ? `Resend for Level ${resendLevel} Check` : "Send for Level 1 Check"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* WhatsApp Notification Modal */}
      <WhatsAppNotificationModal
        isOpen={showWhatsAppModal}
        employeeName={whatsAppData.employeeName}
        taskTitle={whatsAppData.taskTitle}
        clientName={whatsAppData.clientName}
        dueDate={whatsAppData.dueDate}
        assignerName={whatsAppData.assignerName}
        onClose={() => setShowWhatsAppModal(false)}
      />
    </div>
  );
}
