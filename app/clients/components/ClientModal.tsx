"use client";

import { useState, useEffect } from "react";

interface Employee {
  id: number;
  name: string;
  avatar_color: string;
}

interface KMP {
  id?: number;
  name: string;
  designation: string;
  mobile: string;
}

interface Client {
  id?: number;
  name: string;
  type: string;
  mobile: string;
  lead_employee_id: number;
  address: string;
}

interface ClientModalProps {
  isOpen: boolean;
  client: any | null;
  employees: Employee[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export default function ClientModal({
  isOpen,
  client,
  employees,
  onClose,
  onSave,
  onDelete,
}: ClientModalProps) {
  const [formData, setFormData] = useState<Client>({
    name: "",
    type: "",
    mobile: "",
    lead_employee_id: 0,
    address: "",
  });

  const [kmps, setKmps] = useState<KMP[]>([]);
  const [kmpForm, setKmpForm] = useState({ name: "", designation: "", mobile: "" });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        type: client.type,
        mobile: client.mobile,
        lead_employee_id: client.lead_employee_id || 0,
        address: client.address,
      });
      setKmps(client.kmps || []);
    } else {
      setFormData({
        name: "",
        type: "",
        mobile: "",
        lead_employee_id: 0,
        address: "",
      });
      setKmps([]);
    }
    setKmpForm({ name: "", designation: "", mobile: "" });
    setError("");
  }, [client, isOpen]);

  const handleSave = async () => {
    setError("");

    if (!formData.name.trim()) {
      setError("Client name is required");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        ...formData,
        kmps,
      });
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddKmp = () => {
    if (!kmpForm.name.trim()) {
      setError("KMP name is required");
      return;
    }

    setKmps([
      ...kmps,
      {
        name: kmpForm.name,
        designation: kmpForm.designation,
        mobile: kmpForm.mobile,
      },
    ]);

    setKmpForm({ name: "", designation: "", mobile: "" });
    setError("");
  };

  const handleDeleteKmp = (index: number) => {
    setKmps(kmps.filter((_, i) => i !== index));
  };

  const handleDeleteClient = async () => {
    if (!client?.id) return;

    if (!window.confirm("Are you sure you want to delete this client?")) {
      return;
    }

    setIsSaving(true);
    try {
      await onDelete(client.id);
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
          <h2 className="text-2xl font-bold">
            {client ? "Edit Client" : "Add Client"}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Top Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
                placeholder="Enter client name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
                >
                  <option value="">Select type</option>
                  <option value="Pvt Ltd">Pvt Ltd</option>
                  <option value="LLP">LLP</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Proprietorship">Proprietorship</option>
                  <option value="Individual">Individual</option>
                  <option value="Trust">Trust</option>
                  <option value="Society">Society</option>
                  <option value="HUF">HUF</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile
                </label>
                <input
                  type="text"
                  value={formData.mobile}
                  onChange={(e) =>
                    setFormData({ ...formData, mobile: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
                  placeholder="Enter mobile"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lead Employee
              </label>
              <select
                value={formData.lead_employee_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lead_employee_id: parseInt(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
              >
                <option value="">Select lead employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
                placeholder="Enter address"
              />
            </div>
          </div>

          {/* KMP Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Key Managerial Persons
            </h3>

            {/* KMP List */}
            {kmps.length > 0 && (
              <div className="space-y-2 mb-4">
                {kmps.map((kmp, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex justify-between items-start"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{kmp.name}</p>
                      {kmp.designation && (
                        <p className="text-sm text-gray-600">
                          {kmp.designation}
                        </p>
                      )}
                      {kmp.mobile && (
                        <p className="text-sm text-gray-600">{kmp.mobile}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteKmp(index)}
                      className="text-red-600 hover:text-red-700 font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* KMP Input */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="space-y-3">
                <input
                  type="text"
                  value={kmpForm.name}
                  onChange={(e) =>
                    setKmpForm({ ...kmpForm, name: e.target.value })
                  }
                  placeholder="Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350] text-sm"
                />
                <input
                  type="text"
                  value={kmpForm.designation}
                  onChange={(e) =>
                    setKmpForm({ ...kmpForm, designation: e.target.value })
                  }
                  placeholder="Designation"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350] text-sm"
                />
                <input
                  type="text"
                  value={kmpForm.mobile}
                  onChange={(e) =>
                    setKmpForm({ ...kmpForm, mobile: e.target.value })
                  }
                  placeholder="Mobile"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350] text-sm"
                />
                <button
                  onClick={handleAddKmp}
                  className="w-full bg-[#1C3350] text-white px-3 py-2 rounded-lg hover:bg-[#152747] transition text-sm font-semibold"
                >
                  + Add KMP
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="bg-gray-100 px-6 py-4 flex justify-between gap-2 sticky bottom-0">
          <div className="flex gap-2">
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
          {client && (
            <button
              onClick={handleDeleteClient}
              disabled={isSaving}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
