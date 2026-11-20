// Role-Based Access Control utilities
import bcrypt from "bcryptjs";

export type Classification = "admin" | "manager" | "article" | "staff";

// Hash password for secure storage
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export interface User {
  employee_id: number;
  name: string;
  username: string;
  classification: Classification;
}

// Get current user from cookies (client-side)
export function getCurrentUserFromCookies(): User | null {
  if (typeof document === "undefined") return null;

  const employeeId = document.cookie
    .split("; ")
    .find((row) => row.startsWith("employee_id="))
    ?.split("=")[1];

  const employeeName = document.cookie
    .split("; ")
    .find((row) => row.startsWith("employee_name="))
    ?.split("=")[1];

  const classification = document.cookie
    .split("; ")
    .find((row) => row.startsWith("employee_classification="))
    ?.split("=")[1];

  if (!employeeId || !employeeName || !classification) {
    return null;
  }

  return {
    employee_id: parseInt(employeeId),
    name: decodeURIComponent(employeeName),
    username: "",
    classification: classification as Classification,
  };
}

// Role-based permission checks
export const permissions = {
  // Admin only
  canAllocateTasks: (classification: Classification) => classification === "admin",
  canTransferTasks: (classification: Classification) => classification === "admin",
  canViewFeesStructure: (classification: Classification) => classification === "admin",
  canViewAllEmployees: (classification: Classification) => classification === "admin",
  canViewReports: (classification: Classification) => classification === "admin",
  canViewBilling: (classification: Classification) => classification === "admin",

  // Admin + Manager
  canManageTeam: (classification: Classification) =>
    classification === "admin" || classification === "manager",

  // Everyone
  canViewOwnTasks: () => true,
  canViewOwnLeave: () => true,
  canViewOwnAttendance: () => true,
};

// Navigation links based on classification
export function getNavLinks(classification: Classification) {
  const baseLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/tasks", label: "Tasks" },
    { href: "/check/level1", label: "Check L1" },
    { href: "/calendar", label: "Calendar" },
    { href: "/appointments", label: "Appointments" },
    { href: "/bank-accounts", label: "Bank Accounts" },
    { href: "/leave", label: "Leave" },
    { href: "/attendance", label: "Attendance" },
  ];

  const managerLinks = [
    { href: "/check/level2", label: "Check L2" },
    { href: "/manager/appointments", label: "Approvals" },
    { href: "/reports", label: "Reports" },
  ];

  const adminLinks = [
    { href: "/templates", label: "Templates" },
    { href: "/clients", label: "Clients" },
    { href: "/employees", label: "Employees" },
    { href: "/invoices", label: "Invoices" },
    { href: "/billing", label: "Billing" },
    { href: "/dsc", label: "DSC" },
    { href: "/activity", label: "Activity" },
  ];

  if (classification === "admin") {
    return [...baseLinks, ...managerLinks, ...adminLinks];
  }

  if (classification === "manager") {
    return [...baseLinks, ...managerLinks];
  }

  return baseLinks;
}


// Get display name for classification
export function getClassificationLabel(classification: Classification): string {
  const labels: Record<Classification, string> = {
    admin: "Admin",
    manager: "Manager",
    article: "Articled Assistant",
    staff: "Staff",
  };
  return labels[classification];
}

// Strip the bcrypt hash before an employee row leaves the server
export function omitPasswordHash<T extends { password_hash?: unknown }>(row: T): Omit<T, "password_hash"> {
  const copy = { ...row };
  delete copy.password_hash;
  return copy;
}
