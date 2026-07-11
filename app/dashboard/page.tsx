"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavbarRefined from "@/components/NavbarRefined";

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
  title: string;
  employee_id: number;
  status: string;
  due_date: string;
  client: {
    id: number;
    name: string;
  };
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
  const [employeeName, setEmployeeName] = useState("");
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const empNameCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("employee_name="))
        ?.split("=")[1];

      if (!empNameCookie) {
        router.push("/login");
        return;
      }

      setEmployeeName(decodeURIComponent(empNameCookie));

      // Set greeting based on time
      const hour = new Date().getHours();
      if (hour < 12) {
        setGreeting("Good morning");
      } else if (hour < 18) {
        setGreeting("Good afternoon");
      } else {
        setGreeting("Good evening");
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-orange-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-orange-50">
      <NavbarRefined />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-10 py-9">
          {/* Header */}
          <div className="mb-9">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Team Workload</h1>
            <p className="text-slate-600 text-base">Real-time overview of capacity allocation and task distribution</p>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-10">
            {/* Open Tasks Card */}
            <div className="bg-gradient-to-br from-indigo-100 to-purple-100 border border-indigo-300 rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute -top-5 -right-5 w-24 h-24 bg-indigo-400 opacity-10 rounded-full"></div>
              <div className="text-indigo-600 text-xs font-bold uppercase tracking-wider mb-3">📋 Open Tasks</div>
              <div className="text-5xl font-bold text-indigo-600">{openTasksCount}</div>
              <div className="text-slate-600 text-sm mt-2">Awaiting assignment</div>
            </div>

            {/* Overdue Card */}
            <div className="bg-gradient-to-br from-red-100 to-orange-100 border border-red-300 rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute -top-5 -right-5 w-24 h-24 bg-red-400 opacity-10 rounded-full"></div>
              <div className="text-red-600 text-xs font-bold uppercase tracking-wider mb-3">⏰ Overdue</div>
              <div className="text-5xl font-bold text-red-600">{overdueCount}</div>
              <div className="text-slate-600 text-sm mt-2">Past deadline</div>
            </div>

            {/* Available Card */}
            <div className="bg-gradient-to-br from-green-100 to-emerald-100 border border-green-300 rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute -top-5 -right-5 w-24 h-24 bg-green-400 opacity-10 rounded-full"></div>
              <div className="text-green-600 text-xs font-bold uppercase tracking-wider mb-3">✨ Available</div>
              <div className="text-5xl font-bold text-green-600">{freeStaffCount}</div>
              <div className="text-slate-600 text-sm mt-2">Team members ready</div>
            </div>

            {/* On Leave Card */}
            <div className="bg-gradient-to-br from-amber-100 to-yellow-100 border border-amber-300 rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute -top-5 -right-5 w-24 h-24 bg-amber-400 opacity-10 rounded-full"></div>
              <div className="text-amber-600 text-xs font-bold uppercase tracking-wider mb-3">🏖️ On Leave</div>
              <div className="text-5xl font-bold text-amber-600">{onLeaveCount}</div>
              <div className="text-slate-600 text-sm mt-2">This week</div>
            </div>
          </div>

          {/* Team Capacity Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Team Capacity</h2>

            <div className="space-y-6">
              {employees.map((employee, idx) => {
                const workload = calculateWorkload(employee);
                return (
                  <div key={employee.id} className={idx !== employees.length - 1 ? "pb-6 border-b border-slate-100" : ""}>
                    <div className="flex items-center gap-3.5 mb-3.5">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md"
                        style={{
                          background: `linear-gradient(135deg, ${employee.avatar_color} 0%, ${employee.avatar_color}dd 100%)`,
                        }}
                      >
                        {getInitials(employee.name)}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-slate-900">{employee.name}</div>
                        <div className="text-sm text-slate-600">
                          {employee.classification} • {employee.specialisation}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-semibold text-slate-900 mb-1.5">
                          {workload.workload} of {employee.capacity}h
                        </div>
                        <div className="w-36 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full transition-all"
                            style={{
                              width: `${Math.min(workload.percentage, 100)}%`,
                              background: `linear-gradient(90deg, ${employee.avatar_color} 0%, ${employee.avatar_color}dd 100%)`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2.5 mt-3">
                      <span className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
                        Available
                      </span>
                      <span className="text-slate-600 text-xs">
                        {workload.percentage.toFixed(0)}% capacity utilized
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
