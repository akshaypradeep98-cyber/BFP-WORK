"use client";

import { useState, useEffect } from "react";
import { CLASSIFICATIONS, formatDate } from "@/lib/utils";

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

interface EmployeeModalProps {
  isOpen: boolean;
  employee: Employee | null;
  onClose: () => void;
  onSave: (employee: Partial<Employee>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export default function EmployeeModal({
  isOpen,
  employee,
  onClose,
  onSave,
  onDelete,
}: EmployeeModalProps) {
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const [password, setPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (employee) {
      setFormData(employee);
      setPassword("");
    } else {
      setFormData({
        name: "",
        email: "",
        username: "",
        mobile: "",
        classification: "",
        specialisation: "",
        date_of_birth: "",
        weekly_capacity: 40,
        on_leave: false,
      });
      setPassword("");
    }
    setError("");
  }, [employee, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    setError("");

    if (!formData.name || !formData.email || !formData.username) {
      setError("Name, email, and username are required");
      return;
    }

    if (!employee && !password) {
      setError("Password is required for new employees");
      return;
    }

    setIsSaving(true);

    try {
      const dataToSave: any = { ...formData };
      if (password) {
        dataToSave.password = password;
      }

      await onSave(dataToSave);
      onClose();
    } catch (err) {
      setError((err as Error).message || "Failed to save employee");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!employee?.id) return;

    if (
      !confirm(
        `Are you sure you want to delete ${employee.name}? This action cannot be undone.`
      )
    ) {
      return;
    }

    setIsSaving(true);

    try {
      await onDelete(employee.id);
      onClose();
    } catch (err) {
      setError((err as Error).message || "Failed to delete employee");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#1C3350] text-white p-6 sticky top-0 z-10">
          <h2 className="text-2xl font-bold">
            {employee ? "Edit Employee" : "Add New Employee"}
          </h2>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                placeholder="Full name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
                disabled={isSaving}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleChange}
                placeholder="email@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
                disabled={isSaving}
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username || ""}
                onChange={handleChange}
                placeholder="username"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
                disabled={isSaving}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password {!employee && "*"}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  employee ? "Leave blank to keep current" : "Enter password"
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
                disabled={isSaving}
              />
              {employee && (
                <p className="text-xs text-gray-500 mt-1">
                  Leave blank to keep current password
                </p>
              )}
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile
              </label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile || ""}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
                disabled={isSaving}
              />
            </div>

            {/* Classification */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Classification
              </label>
              <select
                name="classification"
                value={formData.classification || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
                disabled={isSaving}
              >
                <option value="">Select...</option>
                {CLASSIFICATIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Specialisation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specialisation / Role
              </label>
              <input
                type="text"
                name="specialisation"
                value={formData.specialisation || ""}
                onChange={handleChange}
                placeholder="e.g. GST / Indirect Tax"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
                disabled={isSaving}
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={
                  formData.date_of_birth
                    ? formatDate(formData.date_of_birth)
                    : ""
                }
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
                disabled={isSaving}
              />
            </div>

            {/* Weekly Capacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weekly Capacity (hours)
              </label>
              <input
                type="number"
                name="weekly_capacity"
                value={formData.weekly_capacity || 40}
                onChange={handleChange}
                min="0"
                max="168"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
                disabled={isSaving}
              />
            </div>

            {/* On Leave */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="on_leave"
                checked={formData.on_leave || false}
                onChange={handleChange}
                className="w-4 h-4 text-[#1C3350] rounded focus:ring-2 focus:ring-[#1C3350]"
                disabled={isSaving}
              />
              <label className="ml-2 text-sm font-medium text-gray-700">
                Mark as on leave
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 p-6 flex justify-between sticky bottom-0 z-10">
          <div>
            {employee && (
              <button
                onClick={handleDelete}
                disabled={isSaving}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-[#1C3350] text-white rounded-lg hover:bg-[#152747] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
