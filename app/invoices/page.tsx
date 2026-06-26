"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";

interface Client {
  id: number;
  name: string;
  type: string;
  address: string;
  mobile: string;
}

interface Task {
  id: number;
  title: string;
  amount: number;
}

interface Payment {
  id: number;
  task_id: number;
  amount: number;
}

const FIRM_NAME = "FirmFlow";
const FIRM_ADDRESS = "123 Business Street, Kochi, Kerala 682001";
const FIRM_GSTIN = "29ABCDE1234F1Z5";
const FIRM_CONTACT = "info@firmflow.in | +91-XXXX-XXXX-XX";

export default function InvoicesPage() {
  const router = useRouter();
  const invoiceRef = useRef<HTMLDivElement>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [currentEmployeeName, setCurrentEmployeeName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    client_id: "",
    invoice_number: "",
    invoice_date: "2026-06-17",
    supply_type: "intra-state",
    cgst_rate: "9",
    sgst_rate: "9",
    igst_rate: "18",
  });

  const [generatedInvoice, setGeneratedInvoice] = useState<{
    client: Client;
    tasks: Task[];
    payments: Payment[];
  } | null>(null);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const employeeNameCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("employee_name="))
        ?.split("=")[1];

      const employeeName = document.cookie
        .split("; ")
        .find((row) => row.startsWith("employee_name="));

      if (!employeeName) {
        router.push("/login");
        return;
      }

      if (employeeNameCookie) {
        setCurrentEmployeeName(decodeURIComponent(employeeNameCookie));
      }

      await fetchClients();
    };

    checkAuthAndFetch();
  }, [router]);

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      if (!response.ok) throw new Error("Failed to fetch clients");
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.client_id || !formData.invoice_number) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      // Fetch tasks for this client
      const tasksResponse = await fetch("/api/tasks");
      if (!tasksResponse.ok) throw new Error("Failed to fetch tasks");
      const allTasks = await tasksResponse.json();
      const clientTasks = allTasks.filter(
        (t: Task) => (t as any).client_id === parseInt(formData.client_id)
      );

      // Fetch payments
      const paymentsResponse = await fetch("/api/payments");
      if (!paymentsResponse.ok) throw new Error("Failed to fetch payments");
      const allPayments = await paymentsResponse.json();

      const selectedClient = clients.find(
        (c) => c.id === parseInt(formData.client_id)
      );

      if (!selectedClient) {
        alert("Client not found");
        return;
      }

      setGeneratedInvoice({
        client: selectedClient,
        tasks: clientTasks,
        payments: allPayments,
      });
    } catch (error) {
      console.error("Error generating invoice:", error);
      alert("Failed to generate invoice");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;

    // Load html2pdf library
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    script.onload = () => {
      const element = invoiceRef.current;
      if (!element) return;

      const opt = {
        margin: 10,
        filename: `invoice_${formData.invoice_number}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
      };

      (window as any).html2pdf().set(opt).from(element).save();
    };
    document.head.appendChild(script);
  };

  const formatRupees = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const calculateInvoiceTotals = () => {
    if (!generatedInvoice) return null;

    const subtotal = generatedInvoice.tasks.reduce((sum, t) => sum + t.amount, 0);
    const received = generatedInvoice.payments
      .filter((p) =>
        generatedInvoice.tasks.some((t) => t.id === p.task_id)
      )
      .reduce((sum, p) => sum + p.amount, 0);

    let cgstAmount = 0,
      sgstAmount = 0,
      igstAmount = 0,
      totalGST = 0,
      totalIncGST = 0;

    if (formData.supply_type === "intra-state") {
      const cgstRate = parseFloat(formData.cgst_rate) || 0;
      const sgstRate = parseFloat(formData.sgst_rate) || 0;
      cgstAmount = Math.round((subtotal * cgstRate) / 100);
      sgstAmount = Math.round((subtotal * sgstRate) / 100);
      totalGST = cgstAmount + sgstAmount;
      totalIncGST = subtotal + totalGST;
    } else {
      const igstRate = parseFloat(formData.igst_rate) || 0;
      igstAmount = Math.round((subtotal * igstRate) / 100);
      totalGST = igstAmount;
      totalIncGST = subtotal + igstAmount;
    }

    const balance = totalIncGST - received;

    return {
      subtotal,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalGST,
      totalIncGST,
      received,
      balance,
      supplyType: formData.supply_type,
      cgstRate: parseFloat(formData.cgst_rate) || 0,
      sgstRate: parseFloat(formData.sgst_rate) || 0,
      igstRate: parseFloat(formData.igst_rate) || 0,
    };
  };

  const totals = calculateInvoiceTotals();

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
            <p className="text-sm text-gray-300 mt-1">Generate Invoice</p>
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
        {!generatedInvoice ? (
          /* Form */
          <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Generate Invoice
            </h2>

            <form onSubmit={handleGenerateInvoice} className="space-y-4">
              {/* Client Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client *
                </label>
                <select
                  value={formData.client_id}
                  onChange={(e) =>
                    setFormData({ ...formData, client_id: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Invoice Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Number *
                  </label>
                  <input
                    type="text"
                    value={formData.invoice_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        invoice_number: e.target.value,
                      })
                    }
                    placeholder="e.g. FWF/2026/001"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
                  />
                </div>

                {/* Invoice Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) =>
                      setFormData({ ...formData, invoice_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
                  />
                </div>
              </div>

              {/* Supply Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supply Type
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="supply_type"
                      value="intra-state"
                      checked={formData.supply_type === "intra-state"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          supply_type: e.target.value,
                        })
                      }
                      className="mr-2 w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">
                      Intra-state (CGST + SGST)
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="supply_type"
                      value="inter-state"
                      checked={formData.supply_type === "inter-state"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          supply_type: e.target.value,
                        })
                      }
                      className="mr-2 w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">
                      Inter-state (IGST)
                    </span>
                  </label>
                </div>
              </div>

              {/* GST Rates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.supply_type === "intra-state" ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CGST (%)
                      </label>
                      <input
                        type="number"
                        value={formData.cgst_rate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cgst_rate: e.target.value,
                          })
                        }
                        min="0"
                        max="100"
                        step="0.5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SGST (%)
                      </label>
                      <input
                        type="number"
                        value={formData.sgst_rate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            sgst_rate: e.target.value,
                          })
                        }
                        min="0"
                        max="100"
                        step="0.5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IGST (%)
                    </label>
                    <input
                      type="number"
                      value={formData.igst_rate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          igst_rate: e.target.value,
                        })
                      }
                      min="0"
                      max="100"
                      step="0.5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350]"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="px-6 py-2 bg-[#1C3350] text-white rounded-lg hover:bg-[#152747] transition font-semibold"
              >
                Generate Invoice
              </button>
            </form>
          </div>
        ) : (
          /* Invoice Display */
          <>
            {/* Action Buttons */}
            <div className="flex gap-3 mb-6 no-print">
              <button
                onClick={handlePrint}
                className="px-6 py-2 bg-[#1C3350] text-white rounded-lg hover:bg-[#152747] transition font-semibold"
              >
                🖨️ Print
              </button>
              <button
                onClick={handleDownloadPDF}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
              >
                📥 Download PDF
              </button>
              <button
                onClick={() => setGeneratedInvoice(null)}
                className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition font-semibold"
              >
                Cancel
              </button>
            </div>

            {/* Invoice */}
            <div
              ref={invoiceRef}
              className="bg-white rounded-lg shadow p-12 max-w-4xl mx-auto invoice-container"
              style={{
                fontFamily: "Arial, sans-serif",
                color: "#333",
                lineHeight: "1.6",
              }}
            >
              {/* Header */}
              <div
                style={{
                  borderBottom: "3px solid #1C3350",
                  paddingBottom: "20px",
                  marginBottom: "30px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: "bold",
                      color: "#1C3350",
                      marginBottom: "8px",
                    }}
                  >
                    {FIRM_NAME}
                  </div>
                  <div style={{ fontSize: "13px", color: "#666" }}>
                    {FIRM_ADDRESS}
                  </div>
                  <div style={{ fontSize: "13px", color: "#666" }}>
                    GSTIN: {FIRM_GSTIN}
                  </div>
                  <div style={{ fontSize: "13px", color: "#666" }}>
                    {FIRM_CONTACT}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: "#1C3350",
                      marginBottom: "10px",
                    }}
                  >
                    INVOICE
                  </div>
                  <div style={{ fontSize: "13px", marginBottom: "5px" }}>
                    <strong>Invoice No:</strong> {formData.invoice_number}
                  </div>
                  <div style={{ fontSize: "13px" }}>
                    <strong>Date:</strong>{" "}
                    {new Date(formData.invoice_date).toLocaleDateString(
                      "en-IN"
                    )}
                  </div>
                </div>
              </div>

              {/* Bill To */}
              <div style={{ marginBottom: "30px" }}>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "#1C3350",
                    marginBottom: "8px",
                  }}
                >
                  BILL TO:
                </div>
                <div style={{ fontSize: "14px", fontWeight: "bold" }}>
                  {generatedInvoice.client.name}
                </div>
                <div style={{ fontSize: "13px", color: "#666" }}>
                  {generatedInvoice.client.type}
                </div>
                <div style={{ fontSize: "13px", color: "#666" }}>
                  {generatedInvoice.client.address}
                </div>
                <div style={{ fontSize: "13px", color: "#666" }}>
                  {generatedInvoice.client.mobile}
                </div>
                <div style={{ fontSize: "13px", color: "#666" }}>
                  GSTIN: N/A
                </div>
              </div>

              {/* Items Table */}
              <table
                style={{
                  width: "100%",
                  marginBottom: "20px",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: "#1C3350",
                      color: "white",
                      fontSize: "12px",
                    }}
                  >
                    <th
                      style={{
                        padding: "10px",
                        textAlign: "left",
                        borderBottom: "1px solid #ddd",
                      }}
                    >
                      Sl.No
                    </th>
                    <th
                      style={{
                        padding: "10px",
                        textAlign: "left",
                        borderBottom: "1px solid #ddd",
                      }}
                    >
                      Service Description
                    </th>
                    <th
                      style={{
                        padding: "10px",
                        textAlign: "right",
                        borderBottom: "1px solid #ddd",
                      }}
                    >
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {generatedInvoice.tasks.map((task, idx) => (
                    <tr key={task.id} style={{ fontSize: "13px" }}>
                      <td
                        style={{
                          padding: "10px",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        {idx + 1}
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        {task.title}
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          borderBottom: "1px solid #eee",
                          textAlign: "right",
                        }}
                      >
                        {formatRupees(task.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              {totals && (
                <div
                  style={{
                    marginBottom: "30px",
                    textAlign: "right",
                    fontSize: "13px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      marginBottom: "8px",
                    }}
                  >
                    <div style={{ width: "250px" }}>
                      <div style={{ textAlign: "right", marginBottom: "8px" }}>
                        <strong>Subtotal (excl. GST):</strong>{" "}
                        {formatRupees(totals.subtotal)}
                      </div>

                      {totals.supplyType === "intra-state" ? (
                        <>
                          <div
                            style={{
                              backgroundColor: "#E1F5EE",
                              padding: "8px",
                              marginBottom: "4px",
                              borderRadius: "4px",
                            }}
                          >
                            <strong>CGST @ {totals.cgstRate}%:</strong>{" "}
                            {formatRupees(totals.cgstAmount)}
                          </div>
                          <div
                            style={{
                              backgroundColor: "#E1F5EE",
                              padding: "8px",
                              marginBottom: "8px",
                              borderRadius: "4px",
                            }}
                          >
                            <strong>SGST @ {totals.sgstRate}%:</strong>{" "}
                            {formatRupees(totals.sgstAmount)}
                          </div>
                        </>
                      ) : (
                        <div
                          style={{
                            backgroundColor: "#E1F5EE",
                            padding: "8px",
                            marginBottom: "8px",
                            borderRadius: "4px",
                          }}
                        >
                          <strong>IGST @ {totals.igstRate}%:</strong>{" "}
                          {formatRupees(totals.igstAmount)}
                        </div>
                      )}

                      <div
                        style={{
                          backgroundColor: "#F5F5F5",
                          padding: "10px",
                          marginBottom: "12px",
                          borderRadius: "4px",
                          fontSize: "15px",
                        }}
                      >
                        <strong style={{ fontSize: "16px" }}>
                          Total (incl. GST):{" "}
                          {formatRupees(totals.totalIncGST)}
                        </strong>
                      </div>
                      <div style={{ marginBottom: "8px" }}>
                        <strong>Received to date:</strong>{" "}
                        {formatRupees(totals.received)}
                      </div>
                      <div
                        style={{
                          backgroundColor: "#FFEBEE",
                          padding: "10px",
                          borderRadius: "4px",
                          color: "#C62828",
                          fontSize: "15px",
                        }}
                      >
                        <strong>Balance Due:</strong>{" "}
                        {formatRupees(totals.balance)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div
                style={{
                  borderTop: "1px solid #ddd",
                  paddingTop: "20px",
                  fontSize: "12px",
                  color: "#666",
                  marginTop: "40px",
                }}
              >
                <div style={{ marginBottom: "5px" }}>
                  <strong>Prepared by:</strong> {currentEmployeeName}
                </div>
                <div style={{ marginBottom: "5px" }}>
                  <strong>Date:</strong>{" "}
                  {new Date(formData.invoice_date).toLocaleDateString("en-IN")}
                </div>
                <div style={{ marginTop: "15px", fontStyle: "italic" }}>
                  This is a computer-generated invoice.
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white;
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          .invoice-container {
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
