"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Appointment {
  id: number;
  task_id: number;
  employee_id: number;
  manager_id: number;
  check_type: string;
  status: string;
  appointment_date?: string;
  appointment_time?: string;
  queue_position: number;
  created_at: string;
  employee?: { id: number; name: string };
  task?: { id: number; title: string };
}

export default function ManagerAppointmentsPage() {
  const router = useRouter();
  const [managerId, setManagerId] = useState<number | null>(null);

  // Appointments state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Time picker state
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  // Load manager and fetch appointments
  useEffect(() => {
    const load = async () => {
      const managerIdFromCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("employee_id="))
        ?.split("=")[1];

      if (!managerIdFromCookie) {
        router.push("/login");
        return;
      }

      const mgrId = parseInt(managerIdFromCookie);
      setManagerId(mgrId);

      // Check if user is a manager
      try {
        const empRes = await fetch(`/api/employees/${mgrId}`);
        if (empRes.ok) {
          const emp = await empRes.json();
          if (!["Manager", "Senior", "Partner"].includes(emp.classification)) {
            router.push("/dashboard");
            return;
          }
        }
      } catch (error) {
        console.error("Error checking manager status:", error);
      }

      await fetchAppointments(mgrId);
      setIsLoading(false);
    };

    load();
  }, [router]);

  const fetchAppointments = async (mgrId: number) => {
    try {
      const response = await fetch("/api/manager/appointments", {
        headers: { "X-Manager-Id": mgrId.toString() },
      });
      if (response.ok) {
        setAppointments(await response.json());
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const handleAction = async (appointmentId: number, action: "accept" | "decline" | "complete") => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) throw new Error("Failed to update");

      const messages: Record<string, string> = {
        accept: "✓ Appointment accepted",
        decline: "✓ Request declined",
        complete: "✓ Appointment marked complete",
      };

      setActionMessage(messages[action]);
      if (managerId) await fetchAppointments(managerId);
      setTimeout(() => setActionMessage(""), 3000);
    } catch (error) {
      alert("Error updating appointment");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSetTime = async (appointmentId: number) => {
    if (!appointmentDate || !appointmentTime) {
      alert("Please select date and time");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set-time",
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
        }),
      });

      if (!response.ok) throw new Error("Failed to set time");

      setActionMessage("✓ Appointment time confirmed");
      setSelectedAppointmentId(null);
      setAppointmentDate("");
      setAppointmentTime("");

      if (managerId) await fetchAppointments(managerId);
      setTimeout(() => setActionMessage(""), 3000);
    } catch (error) {
      alert("Error setting appointment time");
    } finally {
      setIsUpdating(false);
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

  const formatDateTime = (date?: string, time?: string) => {
    if (!date || !time) return "—";
    return `${formatDate(date)} ${formatTime(time)}`;
  };

  const formatSubmitted = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const pendingRequests = appointments.filter((a) => a.status === "requested");
  const acceptedWaiting = appointments.filter((a) => a.status === "accepted");
  const confirmed = appointments.filter((a) => a.status === "confirmed").sort((a, b) => {
    const dateA = new Date(`${a.appointment_date} ${a.appointment_time}`).getTime();
    const dateB = new Date(`${b.appointment_date} ${b.appointment_time}`).getTime();
    return dateA - dateB;
  });

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
            <h1 className="text-3xl font-bold">Appointment Queue</h1>
            <p className="text-sm text-gray-300 mt-1">Manage task check appointments</p>
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
        {actionMessage && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded font-semibold">
            {actionMessage}
          </div>
        )}

        {/* Appointment Requests */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Appointment Requests
            </h2>
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
              {pendingRequests.length} pending
            </span>
          </div>

          {pendingRequests.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No pending requests</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                      Employee
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                      Task
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                      Type
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                      Submitted
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                      Queue
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.map((apt) => (
                    <tr key={apt.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">
                        {apt.employee?.name || "—"}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-900">
                        {apt.task?.title || "—"}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {apt.check_type === "level1_check" ? "L1 Check" : "L2 Approval"}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {formatSubmitted(apt.created_at)}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        #{apt.queue_position}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(apt.id, "accept")}
                            disabled={isUpdating}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleAction(apt.id, "decline")}
                            disabled={isUpdating}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                          >
                            Decline
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Accepted - Waiting for Time */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Accepted - Waiting for Time Confirmation
          </h2>

          {acceptedWaiting.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No appointments waiting for time</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                      Employee
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                      Task
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {acceptedWaiting.map((apt) => (
                    <tr key={apt.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">
                        {apt.employee?.name || "—"}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-900">
                        {apt.task?.title || "—"}
                      </td>
                      <td className="px-6 py-3">
                        <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded text-xs font-semibold">
                          Waiting for scheduling
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        {selectedAppointmentId === apt.id ? (
                          <div className="flex gap-2">
                            <input
                              type="date"
                              value={appointmentDate}
                              onChange={(e) => setAppointmentDate(e.target.value)}
                              className="px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                            <input
                              type="time"
                              value={appointmentTime}
                              onChange={(e) => setAppointmentTime(e.target.value)}
                              className="px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                            <button
                              onClick={() => handleSetTime(apt.id)}
                              disabled={isUpdating}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              {isUpdating ? "Saving..." : "Save"}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedAppointmentId(apt.id);
                              setAppointmentDate("");
                              setAppointmentTime("");
                            }}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Set time
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Confirmed & Upcoming */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Confirmed & Upcoming ({confirmed.length})
          </h2>

          {confirmed.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No confirmed appointments</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                      Employee
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                      Task
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                      Scheduled
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {confirmed.map((apt) => (
                    <tr key={apt.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">
                        {apt.employee?.name || "—"}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-900">
                        {apt.task?.title || "—"}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-900 font-medium">
                        {formatDateTime(apt.appointment_date, apt.appointment_time)}
                      </td>
                      <td className="px-6 py-3">
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                          Confirmed
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => handleAction(apt.id, "complete")}
                          disabled={isUpdating}
                          className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"
                        >
                          Confirm checked
                        </button>
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
