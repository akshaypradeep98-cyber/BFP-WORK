"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface DSCRecord {
  id: number;
  holder_name: string;
  type: string;
  expiry_date: string;
}

const TODAY = new Date("2026-06-17");

export default function DSCRegisterPage() {
  const router = useRouter();
  const [dscRecords, setDscRecords] = useState<DSCRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    holder_name: "",
    type: "Employee",
    expiry_date: "",
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

      await fetchDSCRecords();
    };

    checkAuthAndFetch();
  }, [router]);

  const fetchDSCRecords = async () => {
    try {
      const response = await fetch("/api/dsc-register");
      if (!response.ok) throw new Error("Failed to fetch DSC records");
      const data = await response.json();
      setDscRecords(data);
    } catch (error) {
      console.error("Error fetching DSC records:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDSC = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.holder_name || !formData.expiry_date) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const response = await fetch("/api/dsc-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("API error:", data);
        alert(`Failed to add DSC record: ${data.error || "Unknown error"}`);
        return;
      }

      setFormData({
        holder_name: "",
        type: "Employee",
        expiry_date: "",
      });
      setIsModalOpen(false);
      await fetchDSCRecords();
      alert("DSC record added successfully!");
    } catch (error) {
      console.error("Error adding DSC record:", error);
      alert(`Error: ${error}`);
    }
  };

  const handleDeleteDSC = async (id: number, holderName: string) => {
    if (!confirm(`Delete DSC for ${holderName}?`)) return;

    try {
      const response = await fetch(`/api/dsc-register/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete DSC record");
      await fetchDSCRecords();
    } catch (error) {
      console.error("Error deleting DSC record:", error);
      alert("Failed to delete DSC record");
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const diff = expiry.getTime() - TODAY.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getStatus = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) {
      return { label: "Expired", color: "bg-red-100 text-red-800" };
    } else if (daysUntilExpiry <= 30) {
      return { label: "Expiring soon", color: "bg-amber-100 text-amber-800" };
    } else {
      return { label: "Valid", color: "bg-green-100 text-green-800" };
    }
  };

  const getExpiringAlerts = () => {
    return dscRecords.filter((dsc) => {
      const days = getDaysUntilExpiry(dsc.expiry_date);
      return days <= 30;
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN");
  };

  const expiringAlerts = getExpiringAlerts();

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
            <p className="text-sm text-gray-300 mt-1">DSC Register</p>
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
        {/* Alert Section */}
        {expiringAlerts.length > 0 ? (
          <div className="mb-8">
            {expiringAlerts.map((dsc) => {
              const days = getDaysUntilExpiry(dsc.expiry_date);
              const isExpired = days < 0;
              const bgColor = isExpired ? "bg-red-50" : "bg-amber-50";
              const textColor = isExpired ? "text-red-700" : "text-amber-700";
              const borderColor = isExpired ? "border-red-200" : "border-amber-200";

              return (
                <div
                  key={dsc.id}
                  className={`${bgColor} border ${borderColor} rounded-lg p-4 mb-3 ${textColor}`}
                >
                  ⚠️ {dsc.holder_name} expires{" "}
                  {formatDate(dsc.expiry_date)}
                  {isExpired && " (EXPIRED)"}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 text-green-700">
            ✓ All certificates valid
          </div>
        )}

        {/* DSC Table Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">DSC Register</h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-[#1C3350] text-white rounded-lg hover:bg-[#152747] transition font-semibold"
            >
              + Add DSC
            </button>
          </div>

          {dscRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                      Holder
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                      Type
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                      Expiry Date
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dscRecords.map((dsc) => {
                    const daysUntilExpiry = getDaysUntilExpiry(dsc.expiry_date);
                    const status = getStatus(daysUntilExpiry);

                    return (
                      <tr
                        key={dsc.id}
                        className="border-b border-gray-200 hover:bg-gray-50"
                      >
                        <td className="px-6 py-3 text-sm font-medium text-gray-900">
                          {dsc.holder_name}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {dsc.type}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-900">
                          {formatDate(dsc.expiry_date)}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-center">
                          <button
                            onClick={() =>
                              handleDeleteDSC(dsc.id, dsc.holder_name)
                            }
                            className="text-red-600 hover:text-red-700 font-bold text-lg"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No DSC records yet</p>
          )}
        </div>
      </div>

      {/* Add DSC Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Add DSC</h2>

            <form onSubmit={handleAddDSC} className="space-y-4">
              {/* Holder Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Holder Name *
                </label>
                <input
                  type="text"
                  value={formData.holder_name}
                  onChange={(e) =>
                    setFormData({ ...formData, holder_name: e.target.value })
                  }
                  placeholder="e.g. Ravi Menon (Partner)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
                >
                  <option value="Employee">Employee</option>
                  <option value="Client">Client</option>
                </select>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date *
                </label>
                <input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) =>
                    setFormData({ ...formData, expiry_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#1C3350] text-white rounded-lg hover:bg-[#152747] transition font-semibold"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
