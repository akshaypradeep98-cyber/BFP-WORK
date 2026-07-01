"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter username and password");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Invalid credentials");
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      // Set cookies
      document.cookie = `employee_id=${data.employee_id}; path=/; max-age=86400`;
      document.cookie = `employee_name=${encodeURIComponent(data.name)}; path=/; max-age=86400`;
      document.cookie = `employee_classification=${data.classification}; path=/; max-age=86400`;

      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (err) {
      setError("Login failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-firm-cream dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-soft p-8 w-full max-w-md border border-firm-border dark:border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-firm-900 dark:text-white mb-2">BFP Work</h1>
          <p className="text-firm-muted dark:text-gray-400">Accounting Workspace</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-firm-terracottaBg border border-firm-terracotta rounded-lg">
            <p className="text-firm-terracottaText text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-firm-text dark:text-gray-200 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="input-base w-full"
              disabled={isLoading}
            />
            <p className="text-xs text-firm-muted dark:text-gray-400 mt-1">
              Demo: akshay or kaarthik
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-firm-text dark:text-gray-200 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="input-base w-full pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-firm-muted hover:text-firm-text"
                disabled={isLoading}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            <p className="text-xs text-firm-muted dark:text-gray-400 mt-1">
              Password: akshay@123 or kaarthik@123
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full mt-6"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-xs text-firm-muted dark:text-gray-400 text-center mt-6">
          Demo credentials provided above
        </p>
      </div>
    </div>
  );
}
