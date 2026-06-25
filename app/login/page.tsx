"use client";

import { useState } from "react";

export default function LoginPage() {
  const [employeeName, setEmployeeName] = useState("");
  const [employeeId, setEmployeeId] = useState("1");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!employeeName.trim()) {
      alert("Please enter your name");
      return;
    }

    setIsLoading(true);
    try {
      document.cookie = `employee_name=${encodeURIComponent(employeeName)}; path=/; max-age=86400`;
      document.cookie = `employee_id=${employeeId}; path=/; max-age=86400`;

      setTimeout(() => {
        window.location.href = "/clients";
      }, 100);
    } catch (error) {
      alert("Login error: " + error);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1C3350] mb-2">BFP Work</h1>
          <p className="text-gray-600">Work Management System</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Employee Name
            </label>
            <input
              type="text"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Employee ID
            </label>
            <input
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350] focus:border-transparent"
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-[#1C3350] text-white rounded-lg hover:bg-[#152747] transition font-semibold mt-6 disabled:opacity-50"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          Demo login - enter any name to continue
        </p>
      </div>
    </div>
  );
}
