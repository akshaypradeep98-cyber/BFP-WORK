"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Employee {
  id: number;
  name: string;
  avatar_color: string;
  classification: string;
  specialisation: string;
  capacity: number;
  on_leave: boolean;
}

interface Task {
  id: number;
  employee_id: number;
  status: string;
  due_date: string;
}

interface PendingCheck {
  id: number;
  task_id: number;
  check_level: number;
  task: {
    id: number;
    title: string;
    client: {
      id: number;
      name: string;
    };
    employee: {
      id: number;
      name: string;
    };
  };
}

interface PendingLevel2 {
  id: number;
  task_id: number;
  check_level: number;
  task: Task;
  checker: Employee;
  created_at: string;
}

interface EmployeeWorkload {
  employee: Employee;
  openTasks: number;
  workload: number;
  percentage: number;
  status: "free" | "light" | "busy" | "overloaded";
}

export default function TeamWorkloadDashboard() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pendingChecks, setPendingChecks] = useState<PendingCheck[]>([]);
  const [pendingLevel2, setPendingLevel2] = useState<PendingLevel2[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const employeeName = document.cookie
        .split("; ")
        .find((row) => row.startsWith("employee_name="));

      if (!employeeName) {
        router.push("/login");
        return;
      }

      await Promise.all([
        fetchEmployees(),
        fetchTasks(),
        fetchPendingChecks(),
        fetchPendingLevel2Approvals(),
      ]);
    };

    checkAuthAndFetch();
  }, [router]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees");
      if (!response.ok) throw new Error("Failed to fetch employees");
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks");
      if (!response.ok) throw new Error("Failed to fetch tasks");
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const fetchPendingChecks = async () => {
    try {
      const response = await fetch("/api/checks/level1");
      if (!response.ok) throw new Error("Failed to fetch pending checks");
      const data = await response.json();
      setPendingChecks(data);
    } catch (error) {
      console.error("Error fetching pending checks:", error);
    }
  };

  const fetchPendingLevel2Approvals = async () => {
    try {
      const response = await fetch("/api/checks/level2");
      if (!response.ok) throw new Error("Failed to fetch level 2 approvals");
      const data = await response.json();
      setPendingLevel2(data);
    } catch (error) {
      console.error("Error fetching level 2 approvals:", error);
    }
  };

  const getOpenTasks = (employeeId: number) => {
    return tasks.filter(
      (t) => t.employee_id === employeeId && t.status !== "done"
    );
  };

  const calculateWorkload = (employee: Employee): EmployeeWorkload => {
    const openTasks = getOpenTasks(employee.id);
    const taskCount = openTasks.length;
    const workload = taskCount * 6;
    const capacity = employee.capacity || 40;
    const percentage = (workload / capacity) * 100;

    let status: "free" | "light" | "busy" | "overloaded";
    if (employee.on_leave) {
      status = "free";
    } else if (percentage < 60) {
      status = "light";
    } else if (percentage <= 100) {
      status = "busy";
    } else {
      status = "overloaded";
    }

    return {
      employee,
      openTasks: taskCount,
      workload,
      percentage,
      status,
    };
  };

  const openTasksCount = tasks.filter((t) => t.status !== "done").length;
  const overdueCount = tasks.filter(
    (t) =>
      t.status !== "done" &&
      new Date(t.due_date) < new Date("2026-06-17")
  ).length;
  const workloads = employees.map(calculateWorkload);
  const freeStaffCount = workloads.filter(
    (w) => !w.employee.on_leave && w.percentage < 60
  ).length;
  const onLeaveCount = employees.filter((e) => e.on_leave).length;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getWorkloadColor = (status: string) => {
    switch (status) {
      case "light":
        return "bg-green-500";
      case "busy":
        return "bg-amber-500";
      case "overloaded":
        return "bg-red-500";
      default:
        return "bg-gray-300";
    }
  };

  const getWorkloadBadgeColor = (status: string) => {
    switch (status) {
      case "light":
        return "bg-green-100 text-green-800";
      case "busy":
        return "bg-amber-100 text-amber-800";
      case "overloaded":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getWorkloadLabel = (status: string, onLeave: boolean) => {
    if (onLeave) return "On leave";
    switch (status) {
      case "light":
        return "Light";
      case "busy":
        return "Busy";
      case "overloaded":
        return "Overloaded";
      default:
        return "Free";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      {/* Header */}
      <div className="bg-[#1C3350] text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">BFP Work</h1>
            <p className="text-sm text-gray-300 mt-1">Team Workload</p>
          </div>
          <button
            onClick={() => {
              document.cookie = "employee_id=; max-age=0; path=/";
              document.cookie = "employee_name=; max-age=0; path=/";
              router.push("/login");
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-6">
            <p className="text-3xl font-bold text-[#1C3350] dark:text-amber-400">{openTasksCount}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Open Tasks</p>
          </div>
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-6">
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">{overdueCount}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Overdue</p>
          </div>
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-6">
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{freeStaffCount}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Free Staff</p>
          </div>
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-6">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{onLeaveCount}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">On Leave</p>
          </div>
        </div>

        {/* Pending Level 1 Checks Section */}
        {pendingChecks.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                📋 Level 1 Pending Checks ({pendingChecks.length})
              </h2>
              <Link
                href="/check/level1"
                className="text-[#1C3350] dark:text-blue-400 hover:underline font-semibold"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingChecks.slice(0, 3).map((check) => (
                <Link
                  key={check.id}
                  href="/check/level1"
                  className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 border-l-4 border-amber-500 hover:shadow-lg transition"
                >
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {check.task_title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {check.client_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Worker: {check.worker_name}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Pending Level 2 Approvals Section */}
        {pendingLevel2.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                ✓ Level 2 Pending Approvals ({pendingLevel2.length})
              </h2>
              <Link
                href="/check/level2"
                className="text-[#1C3350] dark:text-blue-400 hover:underline font-semibold"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingLevel2.slice(0, 3).map((approval) => (
                <Link
                  key={approval.id}
                  href="/check/level2"
                  className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 border-l-4 border-purple-500 hover:shadow-lg transition"
                >
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {approval.task_title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {approval.client_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    L1 Checker: {approval.checker_name}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Employee Workload Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workloads.map((workload) => (
            <Link
              key={workload.employee.id}
              href="/tasks"
              className={`bg-white dark:bg-gray-700 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition cursor-pointer ${
                workload.employee.on_leave ? "opacity-60" : ""
              }`}
            >
              {/* Avatar and Name */}
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                  style={{ backgroundColor: workload.employee.avatar_color }}
                >
                  {getInitials(workload.employee.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white truncate">
                    {workload.employee.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                    {workload.employee.classification}
                    {workload.employee.specialisation &&
                      ` · ${workload.employee.specialisation}`}
                  </p>
                </div>
              </div>

              {/* Workload Bar */}
              <div className="mb-3">
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all ${getWorkloadColor(
                      workload.status
                    )}`}
                    style={{
                      width: `${Math.min(workload.percentage, 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Badge and Tasks */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    workload.employee.on_leave
                      ? "bg-blue-100 text-blue-800"
                      : getWorkloadBadgeColor(workload.status)
                  }`}
                >
                  {getWorkloadLabel(workload.status, workload.employee.on_leave)}
                </span>
                <p className="text-xs text-gray-600">
                  {workload.openTasks} open task{workload.openTasks !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Percentage */}
              <p className="text-xs text-gray-500 mt-2">
                {workload.percentage.toFixed(0)}% of {workload.employee.capacity}h
              </p>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
