"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getCurrentUserFromCookies, getNavLinks } from "@/lib/auth";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

interface NavLink {
  label: string;
  href: string;
}

export default function NavbarRefined() {
  const router = useRouter();
  const pathname = usePathname();
  const [employeeName, setEmployeeName] = useState("");
  const [navLinks, setNavLinks] = useState<NavLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const empNameCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("employee_name="))
      ?.split("=")[1];

    if (!empNameCookie) {
      router.push("/login");
      return;
    }

    setEmployeeName(decodeURIComponent(empNameCookie));

    const user = getCurrentUserFromCookies();
    if (user) {
      setNavLinks(getNavLinks(user.classification));
    }
    setIsLoading(false);
  }, [router]);

  if (pathname === "/login" || isLoading) {
    return null;
  }

  const handleLogout = async () => {
    await createBrowserSupabaseClient().auth.signOut();
    document.cookie = "employee_id=; max-age=0; path=/";
    document.cookie = "employee_name=; max-age=0; path=/";
    document.cookie = "employee_classification=; max-age=0; path=/";
    router.push("/login");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const visibleTabs = navLinks;

  return (
    <nav className="bg-white/85 backdrop-blur-lg border-b border-violet-500/12 sticky top-0 z-50">
      <div className="px-8 py-4 flex items-center justify-between gap-8">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-9 h-9 rounded-[11px] bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-600/35">
            <span className="text-white font-black text-lg">B</span>
          </div>
          <span className="font-black text-lg bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
            BFP Work
          </span>
        </Link>

        {/* Tabs */}
        <div className="flex flex-wrap gap-0.5 flex-1">
          {visibleTabs.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition ${
                  isActive
                    ? "bg-violet-100 text-violet-600"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* User Section */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 bg-violet-600/6 rounded-full">
            <span className="text-sm font-bold text-slate-700">{employeeName}</span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
              {getInitials(employeeName)}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-1.5 bg-gradient-to-r from-red-500 to-red-400 hover:from-red-600 hover:to-red-500 text-white text-sm font-bold rounded-lg transition shadow-lg shadow-red-500/30"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
