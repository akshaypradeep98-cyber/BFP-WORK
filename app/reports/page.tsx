"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Employee {
  id: number;
  name: string;
}

interface Task {
  id: number;
  title: string;
  client_id: number;
  division_id: number;
  amount: number;
  tax_period?: string;
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

interface Payment {
  id: number;
  task_id: number;
  amount: number;
  payment_date: string;
  mode: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const [formData, setFormData] = useState({
    employee_id: "",
    from_date: "2026-06-01",
    to_date: "2026-06-17",
    tax_period: "",
  });

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
        fetchClients(),
        fetchDivisions(),
        fetchPayments(),
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

  const fetchPayments = async () => {
    try {
      const response = await fetch("/api/payments");
      if (!response.ok) throw new Error("Failed to fetch payments");
      const data = await response.json();
      setPayments(data);
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  };

  const getTotalReceived = (taskId: number) => {
    return payments
      .filter((p) => p.task_id === taskId)
      .reduce((sum, p) => sum + p.amount, 0);
  };

  const formatRupees = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleExportWorkLog = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.from_date || !formData.to_date) {
      alert("Please select both from and to dates");
      return;
    }

    if (new Date(formData.to_date) < new Date(formData.from_date)) {
      alert("End date must be after start date");
      return;
    }

    setIsExporting(true);

    try {
      const response = await fetch("/api/reports/work-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: formData.employee_id || null,
          from_date: formData.from_date,
          to_date: formData.to_date,
          tax_period: formData.tax_period || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      // Get filename from header
      const contentDisposition = response.headers.get("content-disposition");
      const fileName =
        contentDisposition?.split("filename=")[1]?.replace(/"/g, "") ||
        `work_log_${new Date().toISOString().split("T")[0]}.csv`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      alert("Work log exported successfully!");
    } catch (error) {
      console.error("Error exporting work log:", error);
      alert("Failed to export work log. Check the dev console for details.");
    } finally {
      setIsExporting(false);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1C3350] text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">BFP Work</h1>
            <p className="text-sm text-gray-300 mt-1">Reports</p>
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
        {/* Info Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-blue-800">
            <strong>ℹ️ Note:</strong> All charts use data from tasks and subtasks.
            Work log uses actual time logged on subtasks.
          </p>
        </div>

        {/* Work Log Export Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Work Log Export</h2>

          <form onSubmit={handleExportWorkLog} className="space-y-4">
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
                  <option value="">All Employees</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tax Period Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Period
                </label>
                <select
                  value={formData.tax_period}
                  onChange={(e) =>
                    setFormData({ ...formData, tax_period: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
                >
                  <option value="">All Periods</option>
                  <option value="25-26">FY 25-26</option>
                  <option value="24-25">FY 24-25</option>
                  <option value="23-24">FY 23-24</option>
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
            </div>

            <button
              type="submit"
              disabled={isExporting}
              className="px-6 py-2 bg-[#1C3350] text-white rounded-lg hover:bg-[#152747] transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? "Exporting..." : "Export to CSV"}
            </button>
          </form>

          {/* CSV Format Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              CSV Columns:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• Date (when work was last logged)</li>
              <li>• Employee (assigned to task)</li>
              <li>• Task (task title)</li>
              <li>• Client (client name)</li>
              <li>• Subtask (subtask title)</li>
              <li>• Tax Period (financial year)</li>
              <li>• Done (Yes/No)</li>
              <li>• Time (minutes)</li>
              <li>• Time (hh:mm format)</li>
            </ul>
            <p className="text-xs text-gray-500 mt-3">
              Includes only completed subtasks with logged time in the selected date
              range.
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Billing Analytics</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Billed per Division */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Billed per Division</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {divisions.length > 0 ? (
                  divisions.map((division) => {
                    const divisionTasks = tasks.filter((t) => t.division_id === division.id);
                    const divisionTotal = divisionTasks.reduce((sum, t) => sum + t.amount, 0);
                    const maxAmount = Math.max(
                      ...divisions.map((d) =>
                        tasks
                          .filter((t) => t.division_id === d.id)
                          .reduce((sum, t) => sum + t.amount, 0)
                      )
                    );
                    const percentage = maxAmount > 0 ? (divisionTotal / maxAmount) * 100 : 0;

                    return (
                      <div key={division.id}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            {division.name}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatRupees(divisionTotal)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: division.color,
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {divisionTasks.length} {divisionTasks.length === 1 ? "task" : "tasks"}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 text-center">No division data available</p>
                )}
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-600 mb-2">Tax Periods Included:</p>
                <div className="flex gap-2 flex-wrap">
                  {Array.from(new Set(tasks.map((t) => t.tax_period || "25-26"))).map(
                    (period) => (
                      <span
                        key={period}
                        className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium"
                      >
                        FY {period}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Billed per Client and Period */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Billed per Client and Period</h3>
              <div className="space-y-6 max-h-96 overflow-y-auto">
                {clients.length > 0 ? (
                  clients
                    .filter((c) => tasks.some((t) => t.client_id === c.id))
                    .map((client) => {
                      const clientTasks = tasks.filter((t) => t.client_id === client.id);
                      const periodGroups: Record<string, number> = {};
                      const allPeriods: string[] = [];

                      clientTasks.forEach((task) => {
                        const period = task.tax_period || "25-26";
                        if (!allPeriods.includes(period)) allPeriods.push(period);
                        periodGroups[period] = (periodGroups[period] || 0) + task.amount;
                      });

                      const clientTotal = clientTasks.reduce((sum, t) => sum + t.amount, 0);
                      const maxClientTotal = Math.max(
                        ...clients
                          .filter((c) => tasks.some((t) => t.client_id === c.id))
                          .map((c) =>
                            tasks
                              .filter((t) => t.client_id === c.id)
                              .reduce((sum, t) => sum + t.amount, 0)
                          )
                      );

                      return (
                        <div key={client.id}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              {client.name}
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {formatRupees(clientTotal)}
                            </span>
                          </div>
                          <div className="flex gap-0 rounded-full h-6 overflow-hidden bg-gray-200">
                            {allPeriods.sort().map((period) => {
                              const amount = periodGroups[period] || 0;
                              const width = maxClientTotal > 0 ? (amount / maxClientTotal) * 100 : 0;
                              const colors: Record<string, string> = {
                                "25-26": "#3B82F6",
                                "24-25": "#8B5CF6",
                                "23-24": "#EC4899",
                              };

                              return (
                                <div
                                  key={period}
                                  className="h-full transition-all duration-300"
                                  style={{
                                    width: `${width}%`,
                                    backgroundColor: colors[period] || "#6B7280",
                                  }}
                                  title={`${period}: ${formatRupees(amount)}`}
                                ></div>
                              );
                            })}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {allPeriods.map((p) => `${p}: ${formatRupees(periodGroups[p])}`).join(" | ")}
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <p className="text-gray-500 text-center">No client data available</p>
                )}
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-600 mb-2">Period Legend:</p>
                <div className="flex gap-4 flex-wrap text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#3B82F6" }}></div>
                    <span className="text-gray-600">FY 25-26</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#8B5CF6" }}></div>
                    <span className="text-gray-600">FY 24-25</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#EC4899" }}></div>
                    <span className="text-gray-600">FY 23-24</span>
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
