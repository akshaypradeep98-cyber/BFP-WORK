"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ClientExportPage() {
  const router = useRouter();
  const [clientCount, setClientCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pastExports, setPastExports] = useState<any[]>([]);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const employeeName = document.cookie
        .split("; ")
        .find((row) => row.startsWith("employee_name="));

      if (!employeeName) {
        router.push("/login");
        return;
      }

      await fetchClientCount();
      loadPastExports();
      setIsLoading(false);
    };

    checkAuthAndFetch();
  }, [router]);

  const fetchClientCount = async () => {
    try {
      const response = await fetch("/api/clients");
      if (response.ok) {
        const data = await response.json();
        setClientCount(data.length);
      }
    } catch (error) {
      console.error("Error fetching client count:", error);
    }
  };

  const loadPastExports = () => {
    const saved = localStorage.getItem("pastExports");
    if (saved) {
      setPastExports(JSON.parse(saved));
    }
  };

  const handleDownloadExcel = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch("/api/clients/export");
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `clients_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Save to past exports
      const newExport = {
        date: new Date().toLocaleDateString("en-IN"),
        clientCount,
        timestamp: Date.now(),
      };
      const updated = [newExport, ...pastExports].slice(0, 5);
      localStorage.setItem("pastExports", JSON.stringify(updated));
      setPastExports(updated);
    } catch (error) {
      alert("Error downloading file: " + error);
    } finally {
      setIsDownloading(false);
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
      {/* Header */}
      <div className="bg-[#1C3350] text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Export Clients</h1>
              <p className="text-sm text-gray-300 mt-1">Download client data as Excel file</p>
            </div>
            <button
              onClick={() => router.push("/clients")}
              className="text-white hover:text-gray-300 transition"
            >
              ← Back to Clients
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Export Card */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Download Client Data</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <p className="text-gray-700 font-semibold text-lg">
                Total Clients: <span className="text-blue-600">{clientCount.toLocaleString()}</span>
              </p>
              <p className="text-gray-600 text-sm mt-2">
                All client information including names, contact details, key managerial persons, and associated documents
              </p>
            </div>

            <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-gray-700 font-semibold mb-4">Ready to export?</p>
              <p className="text-gray-600 text-sm mb-6">
                Your Excel file will include all clients with their complete information
              </p>
              <button
                onClick={handleDownloadExcel}
                disabled={isDownloading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold transition"
              >
                {isDownloading ? "Downloading..." : "📥 Download Excel"}
              </button>
            </div>
          </div>

          {/* File Info */}
          <div className="bg-gray-50 rounded-lg p-4 mt-6">
            <h3 className="font-semibold text-gray-900 mb-2">Excel File Contents:</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• <span className="font-medium">Client Name</span> - Full name of the client</li>
              <li>• <span className="font-medium">Type</span> - Business type (Pvt Ltd, LLP, etc.)</li>
              <li>• <span className="font-medium">Mobile</span> - Contact phone number</li>
              <li>• <span className="font-medium">Address</span> - Business address</li>
              <li>• <span className="font-medium">Lead Employee</span> - Assigned account manager</li>
              <li>• <span className="font-medium">KMP</span> - Key Managerial Persons (Name|Designation|Mobile)</li>
              <li>• <span className="font-medium">Documents</span> - Associated documents</li>
            </ul>
          </div>
        </div>

        {/* Past Exports */}
        {pastExports.length > 0 && (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Latest Exports</h2>
            <div className="space-y-2">
              {pastExports.map((exp, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200">
                  <span className="text-gray-700">
                    {exp.clientCount.toLocaleString()} clients
                  </span>
                  <span className="text-gray-600 text-sm">{exp.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
