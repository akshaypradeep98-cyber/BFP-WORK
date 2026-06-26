"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Employee {
  id: number;
  name: string;
  avatar_color: string;
}

interface LeaveRequest {
  id: number;
  employee_id: number;
  from_date: string;
  to_date: string;
  reason: string;
  status: string;
  approved_by: number;
  created_at: string;
  employee?: Employee;
  approver?: Employee;
}

export default function LeaveManagementPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    employee_id: "",
    from_date: "",
    to_date: "",
    reason: "",
  });

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      // Get current employee ID from cookies
      const employeeIdCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("employee_id="))
        ?.split("=")[1];

      const employeeName = document.cookie
        .split("; ")
        .find((row) => row.startsWith("employee_name="));

      if (!employeeName) {
        router.push("/login");
        return;
      }

      if (employeeIdCookie) {
        setCurrentEmployeeId(parseInt(employeeIdCookie));
        setFormData((prev) => ({ ...prev, employee_id: employeeIdCookie }));
      }

      await Promise.all([fetchEmployees(), fetchLeaveRequests()]);
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

  const fetchLeaveRequests = async () => {
    try {
      const response = await fetch("/api/leave-requests");
      if (!response.ok) throw new Error("Failed to fetch leave requests");
      const data = await response.json();

      // Enrich with employee and approver info
      const enriched = data.map((lr: LeaveRequest) => ({
        ...lr,
        employee: employees.find((e) => e.id === lr.employee_id),
        approver: lr.approved_by ? employees.find((e) => e.id === lr.approved_by) : null,
      }));

      setLeaveRequests(enriched);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employee_id || !formData.from_date || !formData.to_date) {
      alert("Please fill in all required fields");
      return;
    }

    if (new Date(formData.to_date) < new Date(formData.from_date)) {
      alert("End date must be after start date");
      return;
    }

    try {
      const response = await fetch("/api/leave-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: parseInt(formData.employee_id),
          from_date: formData.from_date,
          to_date: formData.to_date,
          reason: formData.reason,
        }),
      });

      if (!response.ok) throw new Error("Failed to apply for leave");

      setSuccessMessage("Leave request submitted successfully!");
      setFormData({
        employee_id: currentEmployeeId?.toString() || "",
        from_date: "",
        to_date: "",
        reason: "",
      });

      setTimeout(() => setSuccessMessage(""), 3000);
      await fetchLeaveRequests();
    } catch (error) {
      console.error("Error applying for leave:", error);
      alert("Failed to apply for leave");
    }
  };

  const handleApprove = async (id: number) => {
    if (!confirm("Approve this leave request?")) return;

    try {
      const response = await fetch(`/api/leave-requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "approved",
          approved_by: currentEmployeeId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("API error:", data);
        alert(`Failed to approve leave: ${data.error || "Unknown error"}`);
        return;
      }

      alert("Leave approved successfully!");
      await fetchLeaveRequests();
    } catch (error) {
      console.error("Error approving leave:", error);
      alert(`Error: ${error}`);
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm("Reject this leave request?")) return;

    try {
      const response = await fetch(`/api/leave-requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "rejected",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("API error:", data);
        alert(`Failed to reject leave: ${data.error || "Unknown error"}`);
        return;
      }

      alert("Leave rejected successfully!");
      await fetchLeaveRequests();
    } catch (error) {
      console.error("Error rejecting leave:", error);
      alert(`Error: ${error}`);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN");
  };

  const pendingRequests = leaveRequests.filter((lr) => lr.status === "pending");
  const approvedRequests = leaveRequests.filter((lr) => lr.status === "approved");

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
            <p className="text-sm text-gray-300 mt-1">Leave Management</p>
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
        {/* Apply for Leave Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Apply for Leave</h2>

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
              ✓ {successMessage}
            </div>
          )}

          <form onSubmit={handleApply} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Employee Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employee
                </label>
                <select
                  value={formData.employee_id}
                  onChange={(e) =>
                    setFormData({ ...formData, employee_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
                >
                  <option value="">Select employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* From Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  value={formData.from_date}
                  onChange={(e) =>
                    setFormData({ ...formData, from_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
                />
              </div>

              {/* To Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  value={formData.to_date}
                  onChange={(e) =>
                    setFormData({ ...formData, to_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (optional)
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
                  placeholder="Reason for leave..."
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-2 bg-[#1C3350] text-white rounded-lg hover:bg-[#152747] transition font-semibold"
            >
              Apply for Leave
            </button>
          </form>
        </div>

        {/* Pending Requests */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Pending Requests
          </h2>

          {pendingRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">
                      Employee
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">
                      Date Range
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">
                      Reason
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">
                      Applied On
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.map((request) => {
                    const emp = employees.find(
                      (e) => e.id === request.employee_id
                    );
                    return (
                      <tr
                        key={request.id}
                        className="border-b border-gray-200 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {emp && (
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                                style={{ backgroundColor: emp.avatar_color }}
                              >
                                {getInitials(emp.name)}
                              </div>
                            )}
                            <span className="text-sm font-medium text-gray-900">
                              {emp?.name || "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatDate(request.from_date)} —{" "}
                          {formatDate(request.to_date)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {request.reason || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(request.created_at)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleApprove(request.id)}
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(request.id)}
                              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No pending requests</p>
          )}
        </div>

        {/* Approved Leaves */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Approved Leaves</h2>

          {approvedRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">
                      Employee
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">
                      Date Range
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">
                      Approved By
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">
                      Approved On
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {approvedRequests.map((request) => {
                    const emp = employees.find(
                      (e) => e.id === request.employee_id
                    );
                    const approver = request.approved_by
                      ? employees.find((e) => e.id === request.approved_by)
                      : null;

                    return (
                      <tr
                        key={request.id}
                        className="border-b border-gray-200 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {emp && (
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                                style={{ backgroundColor: emp.avatar_color }}
                              >
                                {getInitials(emp.name)}
                              </div>
                            )}
                            <span className="text-sm font-medium text-gray-900">
                              {emp?.name || "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatDate(request.from_date)} —{" "}
                          {formatDate(request.to_date)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {approver?.name || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate((request as any).updated_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No approved leaves</p>
          )}
        </div>
      </div>
    </div>
  );
}
