"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

interface ImportPreview {
  filename: string;
  rowCount: number;
  newClients: number;
  existingClients: number;
}

interface ImportResult {
  newAdded: number;
  updated: number;
  skipped: number;
  totalProcessed: number;
  errors: any[];
  duration: string;
}

export default function ClientImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragAreaRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [duplicateHandling, setDuplicateHandling] = useState("skip");
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [existingClients, setExistingClients] = useState<Map<string, any>>(new Map());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const employeeName = document.cookie
        .split("; ")
        .find((row) => row.startsWith("employee_name="));

      if (!employeeName) {
        router.push("/login");
        return;
      }

      // Fetch existing clients
      try {
        const response = await fetch("/api/clients");
        if (response.ok) {
          const data = await response.json();
          const map = new Map(data.map((c: any) => [c.name.toLowerCase() as string, c]));
          setExistingClients(map);
        }
      } catch (error) {
        console.error("Error fetching existing clients:", error);
      }

      setIsLoading(false);
    };

    checkAuthAndFetch();
  }, [router]);

  const analyzeFile = (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);

        let newCount = 0;
        let existingCount = 0;

        for (const row of data) {
          const clientName = row["Client Name"]?.toString().trim();
          if (!clientName) continue;

          if (existingClients.has(clientName.toLowerCase())) {
            existingCount++;
          } else {
            newCount++;
          }
        }

        setPreview({
          filename: file.name,
          rowCount: data.length,
          newClients: newCount,
          existingClients: existingCount,
        });
      } catch (error) {
        alert("Error reading file: " + error);
        setPreview(null);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileSelect = (file: File) => {
    if (file.type === "application/vnd.ms-excel" ||
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
      analyzeFile(file);
    } else {
      alert("Please select an Excel file (.xlsx or .xls)");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleStartImport = async () => {
    if (!preview || !selectedFile) return;

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("duplicateHandling", duplicateHandling);

      const response = await fetch("/api/clients/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Import failed");
      }

      const data = await response.json();
      setResult(data.results);
      setResult((prev) => ({
        ...prev!,
        duration: data.duration,
      }));
    } catch (error) {
      alert("Error importing clients: " + error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleCloseResults = () => {
    setResult(null);
    setPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    router.push("/clients");
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
              <h1 className="text-3xl font-bold">Import Clients</h1>
              <p className="text-sm text-gray-300 mt-1">Import client data from Excel file</p>
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
        {/* Results Modal */}
        {result && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200 px-6 py-4">
                <h2 className="text-2xl font-bold text-gray-900">Import Complete</h2>
                <p className="text-gray-600 text-sm mt-1">Import completed in {result.duration}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 p-6">
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="text-2xl font-bold text-green-600">{result.newAdded}</div>
                  <div className="text-sm text-gray-600">New Added</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">{result.updated}</div>
                  <div className="text-sm text-gray-600">Updated</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-2xl font-bold text-gray-600">{result.skipped}</div>
                  <div className="text-sm text-gray-600">Skipped</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">{result.totalProcessed}</div>
                  <div className="text-sm text-gray-600">Total Processed</div>
                </div>
              </div>

              {/* Errors */}
              {result.errors.length > 0 && (
                <div className="px-6 pb-6">
                  <h3 className="font-semibold text-red-600 mb-3">Issues Found:</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                    {result.errors.map((error, idx) => (
                      <div key={idx} className="text-sm text-red-700 mb-2 last:mb-0">
                        <span className="font-semibold">Row {error.row}</span>
                        {error.client && <span> ({error.client})</span>}: {error.issue}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
                <button
                  onClick={handleCloseResults}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition"
                >
                  Close & Refresh Client List
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Card */}
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Import clients from Excel</h2>

          {!preview ? (
            <>
              {/* File Upload Area */}
              <div
                ref={dragAreaRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
                  isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"
                }`}
              >
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-gray-700 font-semibold mb-2">Drag Excel file here or click to browse</p>
                <p className="text-gray-600 text-sm mb-4">Supports .xlsx and .xls files</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
                >
                  Choose File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  className="hidden"
                />
              </div>

              {/* Format Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <h3 className="font-semibold text-blue-900 mb-2">Expected Excel Format:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Column A: Client Name (required)</li>
                  <li>• Column B: Type</li>
                  <li>• Column C: Mobile</li>
                  <li>• Column D: Address</li>
                  <li>• Column E: Lead Employee</li>
                  <li>• Column F: KMP (Name|Designation|Mobile; separated by semicolon)</li>
                  <li>• Column G: Documents (comma-separated)</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              {/* Preview */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{preview.filename}</p>
                    <p className="text-sm text-gray-600 mt-1">{preview.rowCount} rows found</p>
                  </div>
                  <button
                    onClick={() => {
                      setPreview(null);
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Change File
                  </button>
                </div>

                {/* Counts */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-white rounded p-3">
                    <div className="text-lg font-bold text-green-600">{preview.newClients}</div>
                    <div className="text-sm text-gray-600">New Clients</div>
                  </div>
                  <div className="bg-white rounded p-3">
                    <div className="text-lg font-bold text-amber-600">{preview.existingClients}</div>
                    <div className="text-sm text-gray-600">Existing Clients</div>
                  </div>
                </div>
              </div>

              {/* Duplicate Handling */}
              {preview.existingClients > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">How to handle existing clients?</h3>
                  <div className="space-y-2">
                    <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="duplicate"
                        value="skip"
                        checked={duplicateHandling === "skip"}
                        onChange={(e) => setDuplicateHandling(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="ml-3">
                        <span className="font-semibold text-gray-900">Skip duplicates</span>
                        <p className="text-sm text-gray-600">Don&apos;t re-import existing clients</p>
                      </span>
                    </label>
                    <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="duplicate"
                        value="update"
                        checked={duplicateHandling === "update"}
                        onChange={(e) => setDuplicateHandling(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="ml-3">
                        <span className="font-semibold text-gray-900">Update existing clients</span>
                        <p className="text-sm text-gray-600">Replace data for clients that already exist</p>
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Start Import */}
              <div className="flex gap-3">
                <button
                  onClick={handleStartImport}
                  disabled={isImporting}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold transition"
                >
                  {isImporting ? "Importing..." : "✓ Start Import"}
                </button>
                <button
                  onClick={() => {
                    setPreview(null);
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  disabled={isImporting}
                  className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
