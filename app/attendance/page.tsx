"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AttendanceRecord {
  id: number;
  employee_id: number;
  employee_name: string;
  login_at: string;
  logout_at: string | null;
}

interface Employee {
  id: number;
  name: string;
}

export default function AttendancePage() {
  const router = useRouter();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const employeeName = document.cookie
        .split("; ")
        .find((row) => row.startsWith("employee_name="));

      if (!employeeName) {
        router.push("/login");
        return;
      }

      await Promise.all([fetchAttendanceRecords(), fetchEmployees()]);
    };

    checkAuthAndFetch();
  }, [router]);

  const fetchAttendanceRecords = async (employeeId: number | null = null) => {
    try {
      const url = employeeId
        ? `/api/attendance?employee_id=${employeeId}`
        : "/api/attendance";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch attendance records");
      const data = await response.json();
      setRecords(data);
    } catch (error) {
      console.error("Error fetching attendance records:", error);
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

  const handleEmployeeFilter = (employeeId: number | null) => {
    setSelectedEmployeeId(employeeId);
    setIsLoading(true);
    fetchAttendanceRecords(employeeId);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const calculateDuration = (loginAt: string, logoutAt: string | null) => {
    if (!logoutAt) return "";

    const loginTime = new Date(loginAt).getTime();
    const logoutTime = new Date(logoutAt).getTime();
    const durationMs = logoutTime - loginTime;
    const durationMinutes = Math.floor(durationMs / 60000);

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    return `${hours}h ${minutes}m`;
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
            <h1 className="text-3xl font-bold">BFP Work</h1>
            <p className="text-sm text-gray-300 mt-1">Attendance</p>
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
        {/* Filter Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Employee
          </label>
          <select
            value={selectedEmployeeId || ""}
            onChange={(e) =>
              handleEmployeeFilter(
                e.target.value ? parseInt(e.target.value) : null
              )
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350] bg-white"
          >
            <option value="">Show all employees</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {records.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                      Employee
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                      Date
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                      Login Time
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                      Logout Time
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => {
                    const isActive = !record.logout_at;
                    const bgColor = isActive ? "bg-green-50" : "";

                    return (
                      <tr
                        key={record.id}
                        className={`border-b border-gray-200 hover:bg-gray-50 ${bgColor}`}
                      >
                        <td className="px-6 py-3 text-sm font-medium text-gray-900">
                          {record.employee_name}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {formatDate(record.login_at)}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {formatTime(record.login_at)}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {isActive ? (
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              Active
                            </span>
                          ) : (
                            formatTime(record.logout_at)
                          )}
                        </td>
                        <td className="px-6 py-3 text-sm font-mono text-gray-600">
                          {calculateDuration(record.login_at, record.logout_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-600">
              No attendance records found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
