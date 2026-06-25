"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Task {
  id: number;
  title: string;
  client_id: number;
  division_id: number;
  amount: number;
  tax_period?: string;
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

interface Payment {
  id: number;
  task_id: number;
  amount: number;
  payment_date: string;
  mode: string;
}

type GroupBy = "client" | "division" | "client_period";

export default function BillingPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<GroupBy>("client");

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const employeeName = document.cookie
        .split("; ")
        .find((row) => row.startsWith("employee_name="));

      if (!employeeName) {
        router.push("/login");
        return;
      }

      await Promise.all([
        fetchTasks(),
        fetchClients(),
        fetchDivisions(),
        fetchPayments(),
      ]);
    };

    checkAuthAndFetch();
  }, [router]);

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks");
      if (!response.ok) throw new Error("Failed to fetch tasks");
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      if (!response.ok) throw new Error("Failed to fetch clients");
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const fetchDivisions = async () => {
    try {
      const response = await fetch("/api/divisions");
      if (!response.ok) throw new Error("Failed to fetch divisions");
      const data = await response.json();
      setDivisions(data);
    } catch (error) {
      console.error("Error fetching divisions:", error);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await fetch("/api/payments");
      if (!response.ok) throw new Error("Failed to fetch payments");
      const data = await response.json();
      setPayments(data);
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  };

  const getTaskPayments = (taskId: number) => {
    return payments.filter((p) => p.task_id === taskId);
  };

  const getTotalReceived = (taskId: number) => {
    return getTaskPayments(taskId).reduce((sum, p) => sum + p.amount, 0);
  };

  const formatRupees = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getPaymentStatus = (amount: number, received: number) => {
    const balance = amount - received;
    if (balance === 0) {
      return { label: "Paid", color: "bg-green-100 text-green-800" };
    } else if (received > 0) {
      return { label: "Part-paid", color: "bg-amber-100 text-amber-800" };
    } else {
      return { label: "Unpaid", color: "bg-gray-100 text-gray-800" };
    }
  };

  // Calculate totals
  const totalPayable = tasks.reduce((sum, t) => sum + t.amount, 0);
  const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0);
  const outstanding = totalPayable - totalReceived;

  // Group tasks
  const groupedTasks = tasks.reduce(
    (acc, task) => {
      const groupId = groupBy === "client" ? task.client_id : task.division_id;
      if (!acc[groupId]) {
        acc[groupId] = [];
      }
      acc[groupId].push(task);
      return acc;
    },
    {} as Record<number, Task[]>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const renderSimpleGrouping = () => {
    return Object.entries(groupedTasks).map(([groupId, groupTasks]) => {
      const groupName =
        groupBy === "client"
          ? clients.find((c) => c.id === parseInt(groupId))?.name
          : divisions.find((d) => d.id === parseInt(groupId))?.name;

      const groupPayable = groupTasks.reduce((sum, t) => sum + t.amount, 0);
      const groupReceived = groupTasks.reduce(
        (sum, t) => sum + getTotalReceived(t.id),
        0
      );
      const groupBalance = groupPayable - groupReceived;

      return (
        <tbody key={groupId}>
          <tr className="bg-gray-100 border-b border-gray-200">
            <td colSpan={2} className="px-6 py-3 text-sm font-semibold text-gray-900">
              {groupName}
            </td>
            <td className="text-right px-6 py-3 text-sm font-semibold text-gray-900">
              {formatRupees(groupPayable)}
            </td>
            <td className="text-right px-6 py-3 text-sm font-semibold text-gray-900">
              {formatRupees(groupReceived)}
            </td>
            <td className="text-right px-6 py-3 text-sm font-semibold text-gray-900">
              {formatRupees(groupBalance)}
            </td>
            <td></td>
          </tr>

          {groupTasks.map((task) => {
            const received = getTotalReceived(task.id);
            const balance = task.amount - received;
            const status = getPaymentStatus(task.amount, received);

            return (
              <tr
                key={task.id}
                onClick={() => router.push(`/tasks/${task.id}`)}
                className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-6 py-3"></td>
                <td className="px-6 py-3 text-sm text-gray-900">{task.title}</td>
                <td className="text-right px-6 py-3 text-sm text-gray-900">
                  {formatRupees(task.amount)}
                </td>
                <td className="text-right px-6 py-3 text-sm text-gray-900">
                  {formatRupees(received)}
                </td>
                <td className="text-right px-6 py-3 text-sm text-gray-900">
                  {formatRupees(balance)}
                </td>
                <td className="text-center px-6 py-3">
                  <span className={`inline-block px-3 py-1 rounded text-xs font-semibold ${status.color}`}>
                    {status.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      );
    });
  };

  const renderClientPeriodGrouping = () => {
    const clientPeriodGroups: Record<number, Record<string, Task[]>> = {};

    tasks.forEach((task) => {
      const clientId = task.client_id;
      const period = task.tax_period || "25-26";

      if (!clientPeriodGroups[clientId]) {
        clientPeriodGroups[clientId] = {};
      }
      if (!clientPeriodGroups[clientId][period]) {
        clientPeriodGroups[clientId][period] = [];
      }
      clientPeriodGroups[clientId][period].push(task);
    });

    return Object.entries(clientPeriodGroups).map(([clientId, periods]) => {
      const clientName = clients.find((c) => c.id === parseInt(clientId))?.name;
      const clientPayable = Object.values(periods).flat().reduce((sum, t) => sum + t.amount, 0);
      const clientReceived = Object.values(periods)
        .flat()
        .reduce((sum, t) => sum + getTotalReceived(t.id), 0);
      const clientBalance = clientPayable - clientReceived;

      return (
        <tbody key={clientId}>
          {/* Client Header */}
          <tr className="bg-gray-800 border-b border-gray-200">
            <td colSpan={6} className="px-6 py-3 text-sm font-bold text-white">
              {clientName}
            </td>
          </tr>

          {/* Period Groups */}
          {Object.entries(periods).map(([period, periodTasks]) => {
            const periodPayable = periodTasks.reduce((sum, t) => sum + t.amount, 0);
            const periodReceived = periodTasks.reduce(
              (sum, t) => sum + getTotalReceived(t.id),
              0
            );
            const periodBalance = periodPayable - periodReceived;

            return (
              <React.Fragment key={`${clientId}-${period}`}>
                {/* Period Sub-header */}
                <tr className="bg-gray-200 border-b border-gray-200">
                  <td colSpan={2} className="px-6 py-2 text-sm font-semibold text-gray-900">
                    FY {period}
                  </td>
                  <td className="text-right px-6 py-2 text-sm font-semibold text-gray-900">
                    {formatRupees(periodPayable)}
                  </td>
                  <td className="text-right px-6 py-2 text-sm font-semibold text-gray-900">
                    {formatRupees(periodReceived)}
                  </td>
                  <td className="text-right px-6 py-2 text-sm font-semibold text-gray-900">
                    {formatRupees(periodBalance)}
                  </td>
                  <td></td>
                </tr>

                {/* Task Rows */}
                {periodTasks.map((task) => {
                  const received = getTotalReceived(task.id);
                  const balance = task.amount - received;
                  const status = getPaymentStatus(task.amount, received);

                  return (
                    <tr
                      key={task.id}
                      onClick={() => router.push(`/tasks/${task.id}`)}
                      className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-6 py-3"></td>
                      <td className="px-6 py-3 text-sm text-gray-900">{task.title}</td>
                      <td className="text-right px-6 py-3 text-sm text-gray-900">
                        {formatRupees(task.amount)}
                      </td>
                      <td className="text-right px-6 py-3 text-sm text-gray-900">
                        {formatRupees(received)}
                      </td>
                      <td className="text-right px-6 py-3 text-sm text-gray-900">
                        {formatRupees(balance)}
                      </td>
                      <td className="text-center px-6 py-3">
                        <span className={`inline-block px-3 py-1 rounded text-xs font-semibold ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}

          {/* Client Total */}
          <tr className="bg-gray-300 border-b border-gray-200">
            <td colSpan={2} className="px-6 py-3 text-sm font-bold text-gray-900">
              Total
            </td>
            <td className="text-right px-6 py-3 text-sm font-bold text-gray-900">
              {formatRupees(clientPayable)}
            </td>
            <td className="text-right px-6 py-3 text-sm font-bold text-gray-900">
              {formatRupees(clientReceived)}
            </td>
            <td className="text-right px-6 py-3 text-sm font-bold text-gray-900">
              {formatRupees(clientBalance)}
            </td>
            <td></td>
          </tr>
        </tbody>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1C3350] text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">BFP Work</h1>
              <p className="text-sm text-gray-300 mt-1">Billing</p>
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
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">Total Payable</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatRupees(totalPayable)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">Received</p>
            <p className="text-3xl font-bold text-green-900">
              {formatRupees(totalReceived)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">Outstanding</p>
            <p className={`text-3xl font-bold ${outstanding === 0 ? "text-green-900" : "text-red-900"}`}>
              {formatRupees(outstanding)}
            </p>
          </div>
        </div>

        {/* Toggle */}
        <div className="mb-6">
          <div className="inline-flex gap-2 bg-white rounded-lg p-1 shadow flex-wrap">
            <button
              onClick={() => setGroupBy("client")}
              className={`px-4 py-2 rounded font-semibold text-sm transition ${
                groupBy === "client"
                  ? "bg-[#1C3350] text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              By Client
            </button>
            <button
              onClick={() => setGroupBy("division")}
              className={`px-4 py-2 rounded font-semibold text-sm transition ${
                groupBy === "division"
                  ? "bg-[#1C3350] text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              By Division
            </button>
            <button
              onClick={() => setGroupBy("client_period")}
              className={`px-4 py-2 rounded font-semibold text-sm transition ${
                groupBy === "client_period"
                  ? "bg-[#1C3350] text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              By Client & Period
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                  {groupBy === "client" ? "Client" : groupBy === "division" ? "Division" : "Client / Period"}
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">
                  Task
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-700">
                  Amount
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-700">
                  Received
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-700">
                  Balance
                </th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-700">
                  Status
                </th>
              </tr>
            </thead>
            {groupBy === "client_period" ? renderClientPeriodGrouping() : renderSimpleGrouping()}
          </table>
        </div>
      </div>
    </div>
  );
}
