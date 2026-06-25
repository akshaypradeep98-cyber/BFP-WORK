"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Employee {
  id: number;
  name: string;
  avatar_color: string;
}

interface Client {
  id: number;
  name: string;
}

interface Task {
  id: number;
  title: string;
  client_id: number;
  employee_id: number;
  due_date: string;
  status: string;
}

interface CalendarTask extends Task {
  clientName: string;
  employeeName: string;
  urgency: "overdue" | "urgent" | "normal";
}

const TODAY = new Date("2026-06-17");

export default function CalendarPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 1)); // June 2026

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const employeeName = document.cookie
        .split("; ")
        .find((row) => row.startsWith("employee_name="));

      if (!employeeName) {
        router.push("/login");
        return;
      }

      await Promise.all([fetchTasks(), fetchEmployees(), fetchClients()]);
    };

    checkAuthAndFetch();
  }, [router]);

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks");
      if (!response.ok) throw new Error("Failed to fetch tasks");
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees");
      if (!response.ok) throw new Error("Failed to fetch employees");
      const data = await response.json();
      setEmployees(data);
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

  const enrichTasks = (tasksData: Task[]): CalendarTask[] => {
    return tasksData.map((task) => {
      const dueDate = new Date(task.due_date);
      const daysDiff = Math.floor(
        (dueDate.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24)
      );

      let urgency: "overdue" | "urgent" | "normal";
      if (task.status !== "done" && daysDiff < 0) {
        urgency = "overdue";
      } else if (task.status !== "done" && daysDiff <= 3) {
        urgency = "urgent";
      } else {
        urgency = "normal";
      }

      return {
        ...task,
        clientName: clients.find((c) => c.id === task.client_id)?.name || "—",
        employeeName: employees.find((e) => e.id === task.employee_id)?.name || "Unassigned",
        urgency,
      };
    });
  };

  const enrichedTasks = enrichTasks(tasks);

  const getTasksForDate = (date: Date) => {
    return enrichedTasks.filter(
      (t) =>
        new Date(t.due_date).toDateString() === date.toDateString() &&
        t.status !== "done"
    );
  };

  const getAlertsData = () => {
    return enrichedTasks
      .filter((t) => t.status !== "done" && (t.urgency === "overdue" || t.urgency === "urgent"))
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }

    return days;
  };

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-IN");
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "overdue":
        return "bg-red-100 text-red-700 border-red-200";
      case "urgent":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  const getAlertColor = (urgency: string) => {
    switch (urgency) {
      case "overdue":
        return "border-l-4 border-l-red-600 bg-red-50";
      case "urgent":
        return "border-l-4 border-l-amber-600 bg-amber-50";
      default:
        return "border-l-4 border-l-blue-600 bg-blue-50";
    }
  };

  const monthYear = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const calendarDays = generateCalendarDays();
  const alerts = getAlertsData();
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
            <h1 className="text-3xl font-bold">BFP Work</h1>
            <p className="text-sm text-gray-300 mt-1">Calendar</p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-white hover:text-gray-300 transition"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={previousMonth}
                  className="px-3 py-2 hover:bg-gray-100 rounded transition"
                >
                  ←
                </button>
                <h2 className="text-2xl font-bold text-gray-900">{monthYear}</h2>
                <button
                  onClick={nextMonth}
                  className="px-3 py-2 hover:bg-gray-100 rounded transition"
                >
                  →
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="overflow-x-auto">
                <div className="grid grid-cols-7 gap-2 min-w-full">
                  {/* Week Day Headers */}
                  {weekDays.map((day) => (
                    <div
                      key={day}
                      className="p-2 text-center font-semibold text-gray-700 text-sm"
                    >
                      {day}
                    </div>
                  ))}

                  {/* Calendar Days */}
                  {calendarDays.map((date, index) => {
                    const isToday =
                      date && date.toDateString() === TODAY.toDateString();
                    const tasksForDay = date ? getTasksForDate(date) : [];

                    return (
                      <div
                        key={index}
                        className={`min-h-24 p-2 border rounded-lg transition ${
                          date
                            ? "bg-white border-gray-200 hover:bg-gray-50"
                            : "bg-gray-50 border-gray-100"
                        } ${
                          isToday
                            ? "border-[#1C3350] border-2 bg-blue-50"
                            : ""
                        }`}
                      >
                        {date && (
                          <>
                            <div className="text-sm font-semibold text-gray-900 mb-2">
                              {date.getDate()}
                            </div>
                            <div className="space-y-1">
                              {tasksForDay.slice(0, 3).map((task) => (
                                <button
                                  key={task.id}
                                  onClick={() => router.push(`/tasks/${task.id}`)}
                                  className={`block w-full text-left text-xs px-2 py-1 rounded truncate border transition hover:opacity-80 ${getUrgencyColor(
                                    task.urgency
                                  )}`}
                                  title={task.title}
                                >
                                  {task.title}
                                </button>
                              ))}
                              {tasksForDay.length > 3 && (
                                <div className="text-xs text-gray-500 px-2">
                                  +{tasksForDay.length - 3} more
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Alerts Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Upcoming & Overdue
              </h3>

              {alerts.length > 0 ? (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <button
                      key={alert.id}
                      onClick={() => router.push(`/tasks/${alert.id}`)}
                      className={`w-full text-left p-3 rounded-lg transition ${getAlertColor(
                        alert.urgency
                      )}`}
                    >
                      <p className="font-semibold text-sm mb-1 truncate">
                        {alert.title}
                      </p>
                      <p className="text-xs text-gray-600 mb-1">
                        {alert.clientName}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold">
                          {formatDate(new Date(alert.due_date))}
                        </p>
                        <p className="text-xs text-gray-600">
                          {alert.employeeName}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No alerts</p>
              )}

              {/* Legend */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-3">
                  Legend
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-500"></div>
                    <span className="text-xs text-gray-600">Overdue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-amber-500"></div>
                    <span className="text-xs text-gray-600">Within 3 days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                    <span className="text-xs text-gray-600">Normal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
