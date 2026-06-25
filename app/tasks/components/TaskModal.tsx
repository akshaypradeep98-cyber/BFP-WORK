"use client";

import { useState, useEffect } from "react";

interface Employee {
  id: number;
  name: string;
}

interface Client {
  id: number;
  name: string;
}

interface Division {
  id: number;
  name: string;
}

interface TaskModalProps {
  isOpen: boolean;
  employees: Employee[];
  clients: Client[];
  divisions: Division[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export default function TaskModal({
  isOpen,
  employees,
  clients,
  divisions,
  onClose,
  onSave,
}: TaskModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    client_id: "",
    employee_id: "",
    division_id: "",
    due_date: "",
    amount: "",
    tax_period: "25-26",
  });

  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const TAX_PERIODS = ["25-26", "24-25", "23-24"];

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: "",
        client_id: "",
        employee_id: "",
        division_id: "",
        due_date: "",
        amount: "",
        tax_period: "25-26",
      });
      setError("");
    }
  }, [isOpen]);

  const handleSave = async () => {
    setError("");

    if (!formData.title.trim()) {
      setError("Task title is required");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        title: formData.title,
        client_id: formData.client_id ? parseInt(formData.client_id) : null,
        employee_id: formData.employee_id
          ? parseInt(formData.employee_id)
          : null,
        division_id: formData.division_id
          ? parseInt(formData.division_id)
          : null,
        due_date: formData.due_date || null,
        amount: formData.amount ? parseInt(formData.amount) : 0,
        tax_period: formData.tax_period,
      });
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#1C3350] text-white p-6 flex justify-between items-center sticky top-0">
          <h2 className="text-2xl font-bold">Add Task</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
              placeholder="Enter task title"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client
              </label>
              <select
                value={formData.client_id}
                onChange={(e) =>
                  setFormData({ ...formData, client_id: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
              >
                <option value="">Select client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign to Employee
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Division
              </label>
              <select
                value={formData.division_id}
                onChange={(e) =>
                  setFormData({ ...formData, division_id: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
              >
                <option value="">Select division</option>
                {divisions.map((div) => (
                  <option key={div.id} value={div.id}>
                    {div.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) =>
                  setFormData({ ...formData, due_date: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax Period
              </label>
              <select
                value={formData.tax_period}
                onChange={(e) =>
                  setFormData({ ...formData, tax_period: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
              >
                {TAX_PERIODS.map((period) => (
                  <option key={period} value={period}>
                    {period}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="bg-gray-100 px-6 py-4 flex justify-end gap-2 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-[#1C3350] text-white rounded-lg hover:bg-[#152747] transition disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
