"use client";

import { useState, useEffect } from "react";

interface Payment {
  id: number;
  task_id: number;
  amount: number;
  payment_date: string;
  mode: string;
}

interface PaymentsPanelProps {
  taskId: number;
  taskAmount: number;
  taskExpense: number;
  onTaskUpdate: (amount: number, expense: number) => void;
}

const MODES = ["UPI", "NEFT", "Cheque", "Cash", "Card"];

export default function PaymentsPanel({
  taskId,
  taskAmount,
  taskExpense,
  onTaskUpdate,
}: PaymentsPanelProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPayment, setNewPayment] = useState({
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    mode: "UPI",
  });
  const [amount, setAmount] = useState(taskAmount);
  const [expense, setExpense] = useState(taskExpense);
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [isEditingExpense, setIsEditingExpense] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [taskId]);

  const fetchPayments = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/payments`);
      const data = await response.json();
      if (response.ok) {
        setPayments(data);
      } else {
        console.error("API error:", data);
        setPayments([]);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPayment = async () => {
    if (!newPayment.amount || !newPayment.payment_date) {
      alert("Please fill in all payment fields");
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseInt(newPayment.amount),
          payment_date: newPayment.payment_date,
          mode: newPayment.mode,
        }),
      });

      if (!response.ok) throw new Error("Failed to add payment");
      await fetchPayments();
      setNewPayment({
        amount: "",
        payment_date: new Date().toISOString().split("T")[0],
        mode: "UPI",
      });
    } catch (error) {
      console.error("Error adding payment:", error);
      alert("Failed to add payment");
    }
  };

  const handleDeletePayment = async (paymentId: number) => {
    if (!confirm("Delete this payment?")) return;

    try {
      const response = await fetch(
        `/api/tasks/${taskId}/payments/${paymentId}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete payment");
      await fetchPayments();
    } catch (error) {
      console.error("Error deleting payment:", error);
      alert("Failed to delete payment");
    }
  };

  const handleUpdateAmount = async () => {
    if (amount === taskAmount) {
      setIsEditingAmount(false);
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) throw new Error("Failed to update amount");
      setIsEditingAmount(false);
      onTaskUpdate(amount, expense);
    } catch (error) {
      console.error("Error updating amount:", error);
      alert("Failed to update amount");
    }
  };

  const handleUpdateExpense = async () => {
    if (expense === taskExpense) {
      setIsEditingExpense(false);
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expense }),
      });

      if (!response.ok) throw new Error("Failed to update expense");
      setIsEditingExpense(false);
      onTaskUpdate(amount, expense);
    } catch (error) {
      console.error("Error updating expense:", error);
      alert("Failed to update expense");
    }
  };

  const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = amount - totalReceived;

  const formatRupees = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN");
  };

  return (
    <div className="space-y-6">
      {/* Editable Amount and Expense */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 mb-1">Amount (Payable)</p>
          {isEditingAmount ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <button
                onClick={handleUpdateAmount}
                className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setAmount(taskAmount);
                  setIsEditingAmount(false);
                }}
                className="px-2 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div
              onClick={() => setIsEditingAmount(true)}
              className="text-lg font-bold text-gray-900 cursor-pointer hover:text-[#1C3350]"
            >
              {formatRupees(amount)}
            </div>
          )}
        </div>

        <div className="bg-orange-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 mb-1">Expense</p>
          {isEditingExpense ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={expense}
                onChange={(e) => setExpense(parseInt(e.target.value) || 0)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <button
                onClick={handleUpdateExpense}
                className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setExpense(taskExpense);
                  setIsEditingExpense(false);
                }}
                className="px-2 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div
              onClick={() => setIsEditingExpense(true)}
              className="text-lg font-bold text-gray-900 cursor-pointer hover:text-[#1C3350]"
            >
              {formatRupees(expense)}
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 mb-1">Received</p>
          <p className="text-lg font-bold text-green-900">{formatRupees(totalReceived)}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 mb-1">Balance</p>
          <p className={`text-lg font-bold ${balance === 0 ? "text-green-900" : "text-red-900"}`}>
            {formatRupees(balance)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 mb-1">Status</p>
          <p className="text-sm font-semibold">
            {balance === 0 ? (
              <span className="text-green-600">✓ Paid</span>
            ) : totalReceived > 0 ? (
              <span className="text-amber-600">⚠ Part-paid</span>
            ) : (
              <span className="text-gray-600">○ Unpaid</span>
            )}
          </p>
        </div>
      </div>

      {/* Payments List */}
      {isLoading ? (
        <div className="text-gray-600">Loading payments...</div>
      ) : payments.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-700">
                  Date
                </th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-gray-700">
                  Amount
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-700">
                  Mode
                </th>
                <th className="text-center px-4 py-2 text-xs font-semibold text-gray-700">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {formatDate(payment.payment_date)}
                  </td>
                  <td className="text-right px-4 py-2 text-sm font-semibold text-gray-900">
                    {formatRupees(payment.amount)}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">{payment.mode}</td>
                  <td className="text-center px-4 py-2">
                    <button
                      onClick={() => handleDeletePayment(payment.id)}
                      className="text-red-600 hover:text-red-700 font-bold text-lg"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-600 text-sm">No payments recorded yet</p>
      )}

      {/* Add Payment Form */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <p className="text-sm font-semibold text-gray-900 mb-3">Add Payment</p>
        <div className="grid grid-cols-4 gap-3">
          <input
            type="date"
            value={newPayment.payment_date}
            onChange={(e) =>
              setNewPayment({ ...newPayment, payment_date: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
          />
          <input
            type="number"
            placeholder="Amount"
            value={newPayment.amount}
            onChange={(e) =>
              setNewPayment({ ...newPayment, amount: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
          />
          <select
            value={newPayment.mode}
            onChange={(e) =>
              setNewPayment({ ...newPayment, mode: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
          >
            {MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddPayment}
            className="px-3 py-2 bg-[#1C3350] text-white rounded text-sm font-semibold hover:bg-[#152747] transition"
          >
            Add Payment
          </button>
        </div>
      </div>
    </div>
  );
}
