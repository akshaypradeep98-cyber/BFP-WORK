// Role-Based Access Control utilities

export type Classification = "admin" | "manager" | "article" | "staff";

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
    { href: "/leave", label: "Leave" },
    { href: "/attendance", label: "Attendance" },
  ];

  if (classification === "admin") {
    return [
      ...baseLinks,
      { href: "/employees", label: "Employees" },
      { href: "/clients", label: "Clients" },
      { href: "/calendar", label: "Calendar" },
      { href: "/invoices", label: "Invoices" },
      { href: "/billing", label: "Billing" },
      { href: "/reports", label: "Reports" },
      { href: "/dsc", label: "DSC" },
      { href: "/activity", label: "Activity" },
    ];
  }

  if (classification === "manager") {
    return [
      ...baseLinks,
      { href: "/calendar", label: "Calendar" },
    ];
  }

  // article and staff get minimal access
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
