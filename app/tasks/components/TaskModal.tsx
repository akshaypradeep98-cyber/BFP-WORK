"use client";

import { useState, useEffect } from "react";
import { getTaxPeriods } from "@/lib/utils";

const TAX_PERIODS = getTaxPeriods();

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

interface Template {
  id: number;
  name: string;
  category: string;
  keyword: string | null;
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
    tax_period: TAX_PERIODS[10],
    template_id: "",
  });

  const [templates, setTemplates] = useState<Template[]>([]);
  const [groupedTemplates, setGroupedTemplates] = useState<Record<string, Template[]>>({});
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      setFormData({
        title: "",
        client_id: "",
        employee_id: "",
        division_id: "",
        due_date: "",
        amount: "",
        tax_period: TAX_PERIODS[10],
        template_id: "",
      });
      setError("");
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/templates");
      if (!response.ok) throw new Error("Failed to fetch templates");
      const data = await response.json();
      setTemplates(data);

      // Group by category
      const grouped = data.reduce(
        (acc: Record<string, Template[]>, template: Template) => {
          const category = template.category || "Uncategorized";
          if (!acc[category]) acc[category] = [];
          acc[category].push(template);
          return acc;
        },
        {}
      );
      setGroupedTemplates(grouped);
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    setFormData({ ...formData, template_id: templateId });

    if (templateId) {
      const selected = templates.find((t) => t.id === parseInt(templateId));
      if (selected) {
        setFormData((prev) => ({
          ...prev,
          title: selected.name,
        }));
      }
    }
  };

  const handleSave = async () => {
    setError("");

    if (!formData.title.trim()) {
      setError("Task title is required");
      return;
    }

    setIsSaving(true);
    try {
      const taskTitle = formData.template_id
        ? `${formData.title} - ${formData.tax_period}`
        : formData.title;

      await onSave({
        title: taskTitle,
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
        template_id: formData.template_id ? parseInt(formData.template_id) : null,
      });
      onClose();
    } catch (err: any) {
      setError(err.message);
      console.error("Task save error:", err);
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
              Task Type / Template
            </label>
            <select
              value={formData.template_id}
              onChange={handleTemplateChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
            >
              <option value="">Custom / Blank</option>
              {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                <optgroup key={category} label={category}>
                  {categoryTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                      {template.keyword && ` (${template.keyword})`}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>


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
