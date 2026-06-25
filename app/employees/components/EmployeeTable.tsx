"use client";

import { getInitials } from "@/lib/utils";

interface Employee {
  id: number;
  name: string;
  email: string;
  username: string;
  mobile: string;
  classification: string;
  specialisation: string;
  date_of_birth: string;
  weekly_capacity: number;
  on_leave: boolean;
  avatar_color: string;
}

interface EmployeeTableProps {
  employees: Employee[];
  searchQuery: string;
  onRowClick: (employee: Employee) => void;
}

export default function EmployeeTable({
  employees,
  searchQuery,
  onRowClick,
}: EmployeeTableProps) {
  const filteredEmployees = employees.filter((emp) => {
    const query = searchQuery.toLowerCase();
    return (
      emp.name.toLowerCase().includes(query) ||
      emp.classification?.toLowerCase().includes(query) ||
      emp.specialisation?.toLowerCase().includes(query) ||
      emp.username.toLowerCase().includes(query) ||
      emp.email.toLowerCase().includes(query)
    );
  });

  if (filteredEmployees.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          {employees.length === 0
            ? "No employees added yet. Click '+ Add Employee' to get started."
            : "No employees match your search."}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
              Employee
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
              Classification
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
              Specialisation
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
              Mobile
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
              Email
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
              Username
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredEmployees.map((employee) => (
            <tr
              key={employee.id}
              onClick={() => onRowClick(employee)}
              className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition"
            >
              {/* Employee with Avatar */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: employee.avatar_color }}
                  >
                    {getInitials(employee.name)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{employee.name}</p>
                  </div>
                </div>
              </td>

              {/* Classification */}
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-700">
                  {employee.classification || "-"}
                </span>
              </td>

              {/* Specialisation */}
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-700">
                  {employee.specialisation || "-"}
                </span>
              </td>

              {/* Mobile */}
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-700">
                  {employee.mobile || "-"}
                </span>
              </td>

              {/* Email */}
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-700">{employee.email}</span>
              </td>

              {/* Username */}
              <td className="px-6 py-4 whitespace-nowrap">
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                  {employee.username}
                </code>
              </td>

              {/* Status */}
              <td className="px-6 py-4 whitespace-nowrap">
                {employee.on_leave ? (
                  <span className="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                    On leave
                  </span>
                ) : (
                  <span className="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Active
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
