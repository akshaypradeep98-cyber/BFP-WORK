"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Task {
  id: number;
  title: string;
  check_status: string;
  client?: { id: number; name: string };
}

interface Manager {
  id: number;
  name: string;
  classification: string;
  queue_count: number;
}

interface Appointment {
  id: number;
  task_id: number;
  manager_id: number;
  check_type: string;
  status: string;
  appointment_date?: string;
  appointment_time?: string;
  queue_position: number;
  created_at: string;
  task?: { id: number; title: string };
  manager?: { id: number; name: string };
}

export default function AppointmentsPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState<number | null>(null);

  // Request form state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [selectedManager, setSelectedManager] = useState<number | null>(null);
  const [checkType, setCheckType] = useState<"level1_check" | "level2_approval">("level1_check");
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");

  // Appointments list state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Time picker state
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [isSettingTime, setIsSettingTime] = useState(false);

  // Load employee ID and fetch data
  useEffect(() => {
    const load = async () => {
      const nameFromCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("employee_id="))
        ?.split("=")[1];

      if (!nameFromCookie) {
        router.push("/login");
        return;
      }

      const empId = parseInt(nameFromCookie);
      setEmployeeId(empId);

      // Fetch tasks and managers
      await Promise.all([
        fetchTasks(empId),
        fetchManagers(),
        fetchAppointments(empId),
      ]);

      setIsLoading(false);
    };

    load();
  }, [router]);

  const fetchTasks = async (empId: number) => {
    try {
      const response = await fetch("/api/appointments/tasks", {
        headers: { "X-Employee-Id": empId.toString() },
      });
      if (response.ok) {
        setTasks(await response.json());
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await fetch("/api/appointments/managers");
      if (response.ok) {
        setManagers(await response.json());
      }
    } catch (error) {
      console.error("Error fetching managers:", error);
    }
  };

  const fetchAppointments = async (empId: number) => {
    try {
      const response = await fetch("/api/appointments", {
        headers: { "X-Employee-Id": empId.toString() },
      });
      if (response.ok) {
        setAppointments(await response.json());
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const handleRequestAppointment = async () => {
    if (!selectedTask || !selectedManager || !employeeId) {
      alert("Please select a task and manager");
      return;
    }

    setIsRequesting(true);
    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: selectedTask,
          employee_id: employeeId,
          manager_id: selectedManager,
          check_type: checkType,
        }),
      });

      if (!response.ok) throw new Error("Failed to create appointment");

      const data = await response.json();
      const manager = managers.find((m) => m.id === selectedManager);
      const queue = data.queue_position - 1;

      setRequestMessage(
        `✓ Request sent to ${manager?.name}. You have ${queue} ${
          queue === 1 ? "person" : "people"
        } ahead of you.`
      );

      // Reset form
      setSelectedTask(null);
      setSelectedManager(null);
      setCheckType("level1_check");

      // Refresh appointments
      if (employeeId) {
        await fetchAppointments(employeeId);
        await fetchManagers();
      }

      setTimeout(() => setRequestMessage(""), 4000);
    } catch (error) {
      alert("Error creating appointment");
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSetAppointmentTime = async (appointmentId: number) => {
    if (!appointmentDate || !appointmentTime) {
      alert("Please select date and time");
      return;
    }

    setIsSettingTime(true);
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
        }),
      });

      if (!response.ok) throw new Error("Failed to set time");

      // Refresh appointments
      if (employeeId) {
        await fetchAppointments(employeeId);
      }

      setSelectedAppointmentId(null);
      setAppointmentDate("");
      setAppointmentTime("");
    } catch (error) {
      alert("Error setting appointment time");
    } finally {
      setIsSettingTime(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return "";
    const [h, m] = timeString.split(":");
    return `${h}:${m}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "requested":
        return "bg-blue-100 text-blue-800";
      case "accepted":
        return "bg-amber-100 text-amber-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "requested":
        return "Requested";
      case "accepted":
        return "Accepted";
      case "confirmed":
        return "Confirmed";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const selectedManagerObj = managers.find((m) => m.id === selectedManager);
  const selectedTaskObj = tasks.find((t) => t.id === selectedTask);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1C3350] text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Appointment Requests</h1>
            <p className="text-sm text-gray-300 mt-1">Request time with your manager for task checks</p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-white hover:text-gray-300"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Request Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Request an Appointment</h2>

          {requestMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded">
              {requestMessage}
            </div>
          )}

          <div className="space-y-4">
            {/* Check Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                I need a
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={checkType === "level1_check"}
                    onChange={() => setCheckType("level1_check")}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">Level 1 Check</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={checkType === "level2_approval"}
                    onChange={() => setCheckType("level2_approval")}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">Level 2 Approval</span>
                </label>
              </div>
            </div>

            {/* Task Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                For my task
              </label>
              <select
                value={selectedTask || ""}
                onChange={(e) => setSelectedTask(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
              >
                <option value="">Select a task...</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title} ({task.client?.name || "Unknown"})
                  </option>
                ))}
              </select>
              {tasks.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  No tasks waiting for checks
                </p>
              )}
            </div>

            {/* Manager Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Request from manager
              </label>
              <select
                value={selectedManager || ""}
                onChange={(e) => setSelectedManager(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
              >
                <option value="">Select a manager...</option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name} ({manager.classification})
                  </option>
                ))}
              </select>

              {selectedManagerObj && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                  <p className="font-semibold">
                    Queue: {selectedManagerObj.queue_count} {
                      selectedManagerObj.queue_count === 1 ? "person" : "people"
                    } ahead of you
                  </p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleRequestAppointment}
              disabled={isRequesting || !selectedTask || !selectedManager}
              className="w-full py-3 bg-[#1C3350] text-white rounded-lg font-semibold hover:bg-[#0f1f2e] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRequesting ? "Sending..." : "Request Appointment"}
            </button>
          </div>
        </div>

        {/* Pending Appointments */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Your Pending Appointments ({appointments.length})
          </h2>

          {appointments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No pending appointments
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                      Task
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                      Manager
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                      Type
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                      Queue
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                      When
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((apt) => (
                    <tr key={apt.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-900">
                        {apt.task?.title || "—"}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-900">
                        {apt.manager?.name || "—"}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {apt.check_type === "level1_check" ? "L1 Check" : "L2 Approval"}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-3 py-1 rounded text-xs font-semibold ${getStatusBadge(apt.status)}`}>
                          {getStatusLabel(apt.status)}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        Position {apt.queue_position}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {apt.status === "confirmed"
                          ? `${formatDate(apt.appointment_date)} ${formatTime(apt.appointment_time)}`
                          : "—"}
                      </td>
                      <td className="px-6 py-3">
                        {apt.status === "accepted" && (
                          <>
                            {selectedAppointmentId === apt.id ? (
                              <div className="space-y-2">
                                <input
                                  type="date"
                                  value={appointmentDate}
                                  onChange={(e) => setAppointmentDate(e.target.value)}
                                  className="block w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                                <input
                                  type="time"
                                  value={appointmentTime}
                                  onChange={(e) => setAppointmentTime(e.target.value)}
                                  className="block w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                                <button
                                  onClick={() => handleSetAppointmentTime(apt.id)}
                                  disabled={isSettingTime}
                                  className="w-full px-2 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                                >
                                  {isSettingTime ? "Setting..." : "Set time"}
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedAppointmentId(apt.id);
                                  setAppointmentDate("");
                                  setAppointmentTime("");
                                }}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                              >
                                Set time
                              </button>
                            )}
                          </>
                        )}
                        {apt.status === "confirmed" && (
                          <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                            Coming up
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
