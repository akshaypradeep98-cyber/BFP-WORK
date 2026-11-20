"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavbarRefined from "@/components/NavbarRefined";

interface BankAccount {
  id: number;
  bank_name: string;
  account_number: string;
}

export default function BankAccountsPage() {
  const router = useRouter();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [formData, setFormData] = useState({
    bank_name: "",
    account_number: "",
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

      const classification = document.cookie
        .split("; ")
        .find((row) => row.startsWith("employee_classification="))
        ?.split("=")[1];

      setIsAdmin(classification === "admin");

      await fetchBankAccounts();
    };

    checkAuthAndFetch();
  }, [router]);

  const fetchBankAccounts = async () => {
    try {
      const response = await fetch("/api/bank-accounts");
      if (!response.ok) throw new Error("Failed to fetch bank accounts");
      const data = await response.json();
      setBankAccounts(data);
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.bank_name || !formData.account_number) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const response = await fetch("/api/bank-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`Failed to add bank account: ${data.error || "Unknown error"}`);
        return;
      }

      setFormData({ bank_name: "", account_number: "" });
      setIsModalOpen(false);
      await fetchBankAccounts();
    } catch (error) {
      console.error("Error adding bank account:", error);
      alert(`Error: ${error}`);
    }
  };

  const handleDeleteBankAccount = async (id: number, bankName: string) => {
    if (!confirm(`Delete ${bankName} account?`)) return;

    try {
      const response = await fetch(`/api/bank-accounts/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete bank account");
      await fetchBankAccounts();
    } catch (error) {
      console.error("Error deleting bank account:", error);
      alert("Failed to delete bank account");
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
      <NavbarRefined />
      <div className="bg-[#1C3350] text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">BFP Work</h1>
            <p className="text-sm text-gray-300 mt-1">Bank Accounts</p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-white hover:text-gray-300 transition"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Bank Accounts</h2>
            {isAdmin && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-[#1C3350] text-white rounded-lg hover:bg-[#152747] transition font-semibold"
              >
                + Add Bank Account
              </button>
            )}
          </div>

          {bankAccounts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                      Bank Name
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                      Account Number
                    </th>
                    {isAdmin && (
                      <th className="text-center px-6 py-3 text-xs font-semibold text-gray-700">
                        Action
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {bankAccounts.map((account) => (
                    <tr
                      key={account.id}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">
                        {account.bank_name}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {account.account_number}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-3 text-center">
                          <button
                            onClick={() =>
                              handleDeleteBankAccount(account.id, account.bank_name)
                            }
                            className="text-red-600 hover:text-red-700 font-bold text-lg"
                          >
                            ×
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No bank accounts yet</p>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Add Bank Account
            </h2>

            <form onSubmit={handleAddBankAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name *
                </label>
                <input
                  type="text"
                  value={formData.bank_name}
                  onChange={(e) =>
                    setFormData({ ...formData, bank_name: e.target.value })
                  }
                  placeholder="e.g. HDFC Bank"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number *
                </label>
                <input
                  type="text"
                  value={formData.account_number}
                  onChange={(e) =>
                    setFormData({ ...formData, account_number: e.target.value })
                  }
                  placeholder="e.g. 50100123456789"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
                />
              </div>

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
