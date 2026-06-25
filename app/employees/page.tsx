"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EmployeeTable from "./components/EmployeeTable";
import EmployeeModal from "./components/EmployeeModal";

interface Employee {
  id: number;
  name: string;
  email: string;
  username: string;
  password_hash?: string;
  mobile: string;
  classification: string;
  specialisation: string;
  date_of_birth: string;
  weekly_capacity: number;
  on_leave: boolean;
  avatar_color: string;
}

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication and fetch employees
  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const employeeName = document.cookie
        .split("; ")
        .find((row) => row.startsWith("employee_name="));

      if (!employeeName) {
        router.push("/login");
        return;
      }

      await fetchEmployees();
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

  const handleAddClick = () => {
    setSelectedEmployee(null);
    setIsModalOpen(true);
  };

  const handleRowClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const handleSave = async (employeeData: Partial<Employee>) => {
    try {
      const url = selectedEmployee
        ? `/api/employees/${selectedEmployee.id}`
        : "/api/employees";
      const method = selectedEmployee ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(employeeData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save employee");
      }

      // Refresh the employee list
      await fetchEmployees();
    } catch (error) {
      throw error;
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete employee");
      }

      // Refresh the employee list
      await fetchEmployees();
    } catch (error) {
      throw error;
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
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">BFP Work</h1>
              <p className="text-sm text-gray-300 mt-1">Employee Master</p>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-white hover:text-gray-300 transition"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Title and Actions */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Employee Master
            </h2>
            <button
              onClick={handleAddClick}
              className="px-4 py-2 bg-[#1C3350] text-white rounded-lg hover:bg-[#152747] transition font-semibold"
            >
              + Add Employee
            </button>
          </div>

          {/* Search Box */}
          <input
            type="text"
            placeholder="Search by name, classification, role, or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350] focus:border-transparent"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow">
          <EmployeeTable
            employees={employees}
            searchQuery={searchQuery}
            onRowClick={handleRowClick}
          />
        </div>
      </div>

      {/* Modal */}
      <EmployeeModal
        isOpen={isModalOpen}
        employee={selectedEmployee}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
