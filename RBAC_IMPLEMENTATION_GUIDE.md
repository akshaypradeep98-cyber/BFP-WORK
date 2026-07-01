# Role-Based Access Control (RBAC) Implementation Guide

## ✅ Completed

### 1. Authentication System
- ✅ Login page with username + password fields
- ✅ Password visibility toggle (eye icon)
- ✅ Login API endpoint (`/api/auth/login`)
- ✅ bcrypt password hashing
- ✅ Cookie-based session management
- ✅ Demo credentials:
  - **akshay** / **akshay@123** (Admin)
  - **kaarthik** / **kaarthik@123** (Manager)

### 2. Database Setup
- ✅ `EMPLOYEE_RBAC_SETUP.sql` - SQL migration script
- ✅ Adds `username` and `password_hash` columns to employees table
- ✅ Creates two employees with proper classifications

### 3. Auth Utilities (`lib/auth.ts`)
- ✅ `getCurrentUserFromCookies()` - Get current user from browser cookies
- ✅ `permissions` object with role checks
- ✅ `getNavLinks()` - Get navigation links based on classification
- ✅ `getClassificationLabel()` - Display-friendly classification names

---

## 📋 Remaining Tasks

### 1. Database Migration (REQUIRED FIRST)
**Run in Supabase SQL Editor:**
```sql
-- Copy entire EMPLOYEE_RBAC_SETUP.sql and run it
```

This will:
- Add username/password_hash columns
- Delete existing test employees
- Create akshay (admin) and kaarthik (manager)

### 2. Update Login Redirect
Currently redirects to `/dashboard`. May need to verify this works with new auth flow.

### 3. Role-Protected Routes

Implement guards for these routes:

```typescript
// In each page component that needs protection:
"use client";
import { useRouter } from "next/navigation";
import { getCurrentUserFromCookies, permissions } from "@/lib/auth";

export default function ProtectedPage() {
  const router = useRouter();
  const user = getCurrentUserFromCookies();

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    // Check specific permission
    if (!permissions.canViewFeesStructure(user.classification)) {
      router.push("/dashboard");
      return;
    }
  }, [user, router]);

  if (!user) return <div>Loading...</div>;
  
  // Page content here
}
```

### 4. Pages Needing Protection

| Page | Permission | Action |
|------|-----------|--------|
| `/employees` | `canViewAllEmployees` | Hide from non-admin, redirect if accessed |
| `/billing` | `canViewBilling` | Hide from non-admin, redirect if accessed |
| `/reports` | `canViewReports` | Hide from non-admin, redirect if accessed |
| `/dsc` | `canViewBilling` | Hide from non-admin |
| `/invoices` | Admin/Manager only | Show limited view for managers |

### 5. Update Navbar (Components/Navbar.tsx)

```typescript
// Import at top
import { getCurrentUserFromCookies, getNavLinks } from "@/lib/auth";

// In component
const user = getCurrentUserFromCookies();
const navLinks = user ? getNavLinks(user.classification) : [];

// Render only allowed links
{navLinks.map(link => (
  <Link key={link.href} href={link.href}>
    {link.label}
  </Link>
))}
```

### 6. Dashboard Updates

- Show personalized greeting (already done)
- Hide/show sections based on role:
  - Admin: Full team workload, all stats, pending checks
  - Manager: Only their team's workload
  - Article/Staff: Only their own tasks

### 7. Task Assignment Modal

When user marks task as "done" and needs to assign checker:

```typescript
// In /app/tasks/[id]/page.tsx
if (user.classification === "admin") {
  // Show modal to pick ANY employee
  showTaskAllocationModal();
} else {
  // Non-admin: just wait for admin assignment
  setStatus("waiting_for_checker");
}
```

### 8. Employee Master Page (`/app/employees/page.tsx`)

Add role check at top:

```typescript
useEffect(() => {
  const user = getCurrentUserFromCookies();
  
  if (!user || !permissions.canViewAllEmployees(user.classification)) {
    router.push("/dashboard");
    return;
  }
}, [router]);
```

### 9. Remove Employee ID from UI

**In Employee Master table:**
- Remove ID column
- Show: Name, Classification, Role, Mobile, Email

**In Employee forms:**
- Don't show or request employee_id
- Auto-generate on creation

**In Task assignment dropdowns:**
- Show: Name + Classification
- Example: "Akshay (Admin)", "Kaarthik (Manager)"

### 10. Add Redirect Messages

When non-admin tries to access restricted page:

```typescript
// In useEffect after redirect
if (!permissions.canViewFeesStructure(user.classification)) {
  // Show toast notification (if available)
  showNotification("You don't have access to this page", "error");
  router.push("/dashboard");
  return;
}
```

---

## Testing Checklist

### Test 1: Admin Login
```
Login as akshay / akshay@123
Expected:
- ✅ Redirects to /dashboard
- ✅ Sees full navbar with all links
- ✅ Can access /employees, /billing, /reports
- ✅ Can allocate tasks
```

### Test 2: Manager Login
```
Login as kaarthik / kaarthik@123
Expected:
- ✅ Redirects to /dashboard
- ✅ Sees limited navbar (no Employees, Billing, Reports)
- ✅ Accessing /employees → redirects to /dashboard
- ✅ Accessing /billing → redirects to /dashboard
- ✅ Cannot allocate tasks (sees waiting state instead)
```

### Test 3: Feature Access
```
Create task and mark as Done:
- As Akshay (admin): See task allocation modal
- As Kaarthik (manager): See "waiting for admin" message
```

### Test 4: Navigation
```
Check navbar:
- Admin: 10+ links
- Manager: 5 links (Dashboard, Tasks, Leave, Attendance, Calendar)
- Article/Staff: 4 links (Dashboard, Tasks, Leave, Attendance)
```

---

## Implementation Order

1. **Run EMPLOYEE_RBAC_SETUP.sql** in Supabase
2. Update Navbar with role-based links
3. Add protection to sensitive pages (employees, billing, reports)
4. Update Dashboard with role-aware sections
5. Update task allocation logic
6. Test all access scenarios
7. Deploy to Vercel

---

## Code Snippets

### Check Permission Before Rendering
```typescript
import { permissions } from "@/lib/auth";

{permissions.canViewReports(user.classification) && (
  <Link href="/reports">Reports</Link>
)}
```

### Redirect if Unauthorized
```typescript
useEffect(() => {
  if (!permissions.canViewReports(user.classification)) {
    router.push("/dashboard");
  }
}, [user, router]);
```

### Get User Classification
```typescript
const user = getCurrentUserFromCookies();
if (user?.classification === "admin") {
  // Admin only code
}
```

---

## Files Changed/Created

- ✅ `app/login/page.tsx` - New login with username/password
- ✅ `app/api/auth/login/route.ts` - Authentication endpoint
- ✅ `lib/auth.ts` - Role utilities and permission checks
- ✅ `EMPLOYEE_RBAC_SETUP.sql` - Database migration
- ⏳ `components/Navbar.tsx` - Needs role-aware navigation
- ⏳ `app/dashboard/page.tsx` - Needs role-aware sections
- ⏳ `app/employees/page.tsx` - Needs access protection
- ⏳ `app/billing/page.tsx` - Needs access protection
- ⏳ `app/reports/page.tsx` - Needs access protection
- ⏳ `app/tasks/[id]/page.tsx` - Needs role-aware task allocation

---

## Classifications

### Admin (Akshay)
- Full access to everything
- Can allocate tasks
- Can transfer tasks
- Can view fees structure
- Can see all employees
- Can view reports
- Can access billing

### Manager (Kaarthik)
- Can manage their team
- Cannot allocate tasks
- Cannot transfer tasks
- Cannot see fees structure
- Cannot see other employees' details
- Cannot access reports

### Article / Staff
- Can see only their own tasks
- Cannot allocate/transfer
- Cannot see other employees
- Limited dashboard
- No access to sensitive features

---

## Next Steps

1. ✅ Run the SQL migration to set up employees
2. ⏳ Test login with both accounts
3. ⏳ Implement navbar role checks
4. ⏳ Add access control to sensitive pages
5. ⏳ Update dashboard with role-aware sections
6. ⏳ Full end-to-end testing

