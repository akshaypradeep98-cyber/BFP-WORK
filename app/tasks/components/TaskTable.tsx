"use client";

interface Employee {
  id: number;
  name: string;
  avatar_color: string;
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

interface Task {
  id: number;
  title: string;
  client_id: number;
  employee_id: number;
  division_id: number;
  due_date: string;
  amount: number;
  status: string;
  tax_period?: string;
}

interface TaskTableProps {
  tasks: Task[];
  employees: Employee[];
  clients: Client[];
  divisions: Division[];
  searchQuery: string;
  onRowClick: (task: Task) => void;
}

export default function TaskTable({
  tasks,
  employees,
  clients,
  divisions,
  searchQuery,
  onRowClick,
}: TaskTableProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatRupees = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getDueDateColor = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date("2026-06-16");
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "text-red-600"; // Overdue
    if (diffDays <= 3) return "text-amber-600"; // Within 3 days
    return "text-gray-600";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-gray-100 text-gray-800";
      case "prog":
        return "bg-amber-100 text-amber-800";
      case "done":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "todo":
        return "To do";
      case "prog":
        return "In progress";
      case "done":
        return "Done";
      default:
        return status;
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const query = searchQuery.toLowerCase();
    const client = clients.find((c) => c.id === task.client_id);
    const employee = employees.find((e) => e.id === task.employee_id);

    return (
      task.title.toLowerCase().includes(query) ||
      (client && client.name.toLowerCase().includes(query)) ||
      (employee && employee.name.toLowerCase().includes(query))
    );
  });

  if (filteredTasks.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        {searchQuery ? "No tasks found matching your search" : "No tasks"}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-100 border-b border-gray-200">
          <tr>
            <th className="text-left px-6 py-3 font-semibold text-gray-900 text-sm">
              Task
            </th>
            <th className="text-left px-6 py-3 font-semibold text-gray-900 text-sm">
              Client
            </th>
            <th className="text-left px-6 py-3 font-semibold text-gray-900 text-sm">
              Assigned to
            </th>
            <th className="text-left px-6 py-3 font-semibold text-gray-900 text-sm">
              Status
            </th>
            <th className="text-left px-6 py-3 font-semibold text-gray-900 text-sm">
              Due
            </th>
            <th className="text-left px-6 py-3 font-semibold text-gray-900 text-sm">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredTasks.map((task) => {
            const division = divisions.find((d) => d.id === task.division_id);
            const client = clients.find((c) => c.id === task.client_id);
            const employee = employees.find((e) => e.id === task.employee_id);

            return (
              <tr
                key={task.id}
                onClick={() => onRowClick(task)}
                className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition"
              >
                <td className="px-6 py-4">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {task.title}
                      {task.tax_period && (
                        <span className="text-sm font-normal text-gray-600 ml-2">
                          - {task.tax_period}
                        </span>
                      )}
                    </p>
                    {division && (
                      <div className="mt-1">
                        <span
                          className="inline-block px-2 py-1 rounded text-xs text-white"
                          style={{ backgroundColor: division.color }}
                        >
                          {division.name}
                        </span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {client ? client.name : "—"}
                </td>
                <td className="px-6 py-4">
                  {employee ? (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                        style={{ backgroundColor: employee.avatar_color }}
                      >
                        {getInitials(employee.name)}
                      </div>
                      <span className="text-gray-900">{employee.name}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      task.status
                    )}`}
                  >
                    {getStatusLabel(task.status)}
                  </span>
                </td>
                <td className={`px-6 py-4 ${getDueDateColor(task.due_date)}`}>
                  {task.due_date
                    ? new Date(task.due_date).toLocaleDateString("en-IN")
                    : "—"}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {task.amount > 0 ? formatRupees(task.amount) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
