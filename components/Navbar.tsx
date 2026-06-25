"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

interface NavItem {
  label: string;
  href: string;
  adminOnly?: boolean;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    avatarColor: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Determine if current user is admin/staff
  const [isAdmin, setIsAdmin] = useState(true); // Default to true for now

  const navItems: NavItem[] = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Employees", href: "/employees" },
    { label: "Clients", href: "/clients" },
    { label: "Tasks", href: "/tasks" },
    { label: "Calendar", href: "/calendar" },
    { label: "Leave", href: "/leave" },
    { label: "Billing", href: "/billing", adminOnly: true },
    { label: "Reports", href: "/reports", adminOnly: true },
    { label: "Invoices", href: "/invoices", adminOnly: true },
    { label: "DSC", href: "/dsc", adminOnly: true },
    { label: "Activity", href: "/activity", adminOnly: true },
    { label: "Attendance", href: "/attendance", adminOnly: true },
  ];

  // Initialize on mount
  useEffect(() => {
    console.log("[Navbar] Mounting, pathname:", pathname);

    // Check if dark mode is already applied (from init script)
    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);

    // Get current user from cookie - with multiple attempts
    let employeeName = document.cookie
      .split("; ")
      .find((row) => row.startsWith("employee_name="))
      ?.split("=")[1];

    console.log("[Navbar] Cookie found:", !!employeeName, "Value:", employeeName);

    // If not found, try again after a short delay (sometimes cookies load slowly)
    if (!employeeName) {
      setTimeout(() => {
        const retryName = document.cookie
          .split("; ")
          .find((row) => row.startsWith("employee_name="))
          ?.split("=")[1];

        console.log("[Navbar] Retry cookie found:", !!retryName, "Value:", retryName);

        if (retryName) {
          setCurrentUser({
            name: decodeURIComponent(retryName),
            avatarColor: "#1C3350",
          });
        }
      }, 100);
    }

    if (employeeName) {
      setCurrentUser({
        name: decodeURIComponent(employeeName),
        avatarColor: "#1C3350",
      });
    }

    setIsLoading(false);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Don't show navbar on login page
  if (pathname === "/login") {
    return null;
  }

  const toggleDarkMode = () => {
    try {
      const html = document.documentElement;
      const hasDark = html.classList.contains("dark");
      const shouldBedarK = !hasDark;

      console.log("[toggleDarkMode] Current state:", { hasDark, shouldBedarK });

      // Toggle the class
      if (shouldBedarK) {
        html.classList.add("dark");
        console.log("[toggleDarkMode] Added dark class");
      } else {
        html.classList.remove("dark");
        console.log("[toggleDarkMode] Removed dark class");
      }

      // Verify it was added/removed
      const nowHasDark = html.classList.contains("dark");
      console.log("[toggleDarkMode] After toggle, has dark class:", nowHasDark);
      console.log("[toggleDarkMode] html.className:", html.className);

      // Save to localStorage
      localStorage.setItem("darkMode", shouldBedarK.toString());
      console.log("[toggleDarkMode] Saved to localStorage:", shouldBedarK);

      // Update state
      setIsDarkMode(shouldBedarK);
    } catch (error) {
      console.error("[toggleDarkMode] Error:", error);
    }
  };

  const handleLogout = () => {
    document.cookie = "employee_id=; max-age=0; path=/";
    document.cookie = "employee_name=; max-age=0; path=/";
    router.push("/login");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const visibleNavItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <nav className="fixed top-0 w-full bg-primary-600 dark:bg-primary-800 text-white shadow-lg z-50">
      <div className="max-w-full px-3 sm:px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Logo */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-bold text-lg sm:text-xl hover:opacity-80 transition flex-shrink-0 whitespace-nowrap"
          >
            <span className="text-xl sm:text-2xl">🏢</span>
            <span className="hidden xs:inline">BFP Work</span>
          </Link>

          {/* Middle: Navigation Links (Desktop) */}
          <div className="hidden lg:flex items-center gap-1 justify-center flex-1 mx-4">
            {visibleNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition whitespace-nowrap ${
                  isActive(item.href)
                    ? "bg-accent-400 text-gray-900"
                    : "text-gray-100 hover:bg-primary-700 dark:hover:bg-primary-700"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right: User, Dark Mode, Logout */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            {/* Current User + Avatar (Mobile hidden by default) */}
            {currentUser && (
              <div className="hidden sm:flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                  style={{ backgroundColor: currentUser.avatarColor }}
                >
                  {getInitials(currentUser.name)}
                </div>
                <span className="text-sm text-gray-100 hidden md:inline truncate max-w-[150px]">
                  {currentUser.name}
                </span>
              </div>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-md hover:bg-primary-700 dark:hover:bg-primary-700 transition text-xl flex-shrink-0"
              title={isDarkMode ? "Light mode" : "Dark mode"}
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="px-3 sm:px-4 py-2 bg-error-500 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-800 rounded-md text-xs sm:text-sm font-semibold transition whitespace-nowrap flex-shrink-0 min-h-[40px]"
            >
              Logout
            </button>

            {/* Hamburger Menu (Mobile) */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 hover:bg-primary-700 dark:hover:bg-primary-700 rounded-md transition text-xl flex-shrink-0 min-h-[40px] flex items-center justify-center"
              title="Menu"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden mt-3 pb-3 border-t border-primary-700">
            <div className="flex flex-col gap-1 mt-3 max-h-[calc(100vh-70px)] overflow-y-auto">
              {visibleNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-2.5 rounded-md text-sm font-medium transition min-h-[44px] flex items-center ${
                    isActive(item.href)
                      ? "bg-accent-400 text-gray-900"
                      : "text-gray-100 hover:bg-primary-700"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
