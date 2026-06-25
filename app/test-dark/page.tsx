"use client";

import { useEffect, useState } from "react";

export default function TestDarkPage() {
  const [isDark, setIsDark] = useState(false);
  const [darkClass, setDarkClass] = useState(false);

  useEffect(() => {
    const isDarkElement = document.documentElement.classList.contains("dark");
    setDarkClass(isDarkElement);
    setIsDark(isDarkElement);
  }, []);

  const toggleDark = () => {
    const html = document.documentElement;
    const isCurrentlyDark = html.classList.contains("dark");

    if (isCurrentlyDark) {
      html.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    } else {
      html.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    }

    setDarkClass(!isCurrentlyDark);
    setIsDark(!isCurrentlyDark);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Dark Mode Test
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Check if dark mode is working correctly
          </p>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md border border-gray-300 dark:border-gray-700">
          <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">
            Dark class on html: <strong>{darkClass ? "YES ✓" : "NO ✗"}</strong>
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 font-mono mt-2">
            isDark state: <strong>{isDark ? "YES ✓" : "NO ✗"}</strong>
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 font-mono mt-2">
            localStorage darkMode: <strong>{localStorage.getItem("darkMode") || "not set"}</strong>
          </p>
        </div>

        <button
          onClick={toggleDark}
          className="w-full px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 font-semibold transition"
        >
          Toggle Dark Mode
        </button>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Color Test</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-4 rounded-md">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Primary Color</p>
              <div className="w-full h-12 bg-primary-600 dark:bg-primary-800 rounded"></div>
            </div>

            <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-4 rounded-md">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Accent Color</p>
              <div className="w-full h-12 bg-accent-400 rounded"></div>
            </div>

            <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-4 rounded-md">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Success Color</p>
              <div className="w-full h-12 bg-success-500 rounded"></div>
            </div>

            <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-4 rounded-md">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Error Color</p>
              <div className="w-full h-12 bg-error-500 rounded"></div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md">
          <p className="font-semibold mb-2">Debug Instructions:</p>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Open DevTools (F12)</li>
            <li>Go to Elements tab</li>
            <li>Find the &lt;html&gt; tag</li>
            <li>Check if it has class=&quot;dark&quot; when dark mode is on</li>
            <li>Check Console for any errors</li>
            <li>Hard refresh (Ctrl+Shift+R) and try again</li>
          </ol>
        </div>

        <a href="/dashboard" className="inline-block text-blue-600 dark:text-blue-400 hover:underline">
          ← Back to Dashboard
        </a>
      </div>
    </div>
  );
}
