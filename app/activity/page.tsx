"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ActivityLog {
  id: number;
  employee_id: number;
  employee_name: string;
  action: string;
  detail: string;
  timestamp: string;
}

export default function ActivityLogPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
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

      await fetchActivityLogs();
    };

    checkAuthAndFetch();
  }, [router]);

  const fetchActivityLogs = async () => {
    try {
      const response = await fetch("/api/activity-log");
      if (!response.ok) throw new Error("Failed to fetch activity logs");
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) + ", " + date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
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
            <p className="text-sm text-gray-300 mt-1">Activity Log</p>
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
        {/* Info Section */}
        <div className="mb-6">
          <p className="text-gray-600">Audit trail of all system actions. Newest first.</p>
        </div>

        {/* Activity Log Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                      Timestamp
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                      User
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                      Action
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                      Detail
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="px-6 py-3 text-sm text-gray-500">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">
                        {log.employee_name}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700">
                        {log.action}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {log.detail}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-600">
              No activity logs yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
