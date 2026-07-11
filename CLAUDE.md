# BFP Work — Claude Code Project Notes

## Overview
Web-based practice management system for Chartered Accountant (CA) firms. Handles task allocation, subtask checklists, role-based access, and a two-level checking workflow. **Status**: Production-ready.

## Tech Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, React Hooks
- **Backend**: Supabase PostgreSQL + REST API
- **Auth**: bcrypt password hashing + cookie sessions
- **Styling**: Tailwind CSS (warm design system)
- **Deploy**: Vercel (auto-deploys on git push)

## Default Test Credentials
| Role | Username | Password |
|------|----------|----------|
| Admin | akshay | akshay@123 |
| Manager | kaarthik | kaarthik@123 |
| Article | treesa | treesa@123 |
| Staff | hari | hari@123 |

⚠️ Change all passwords before going live.

## Database Schema (key tables)
- `employees` — users: username, password_hash, classification (admin/manager/article/staff)
- `task_templates` — template master: name, category, keyword
- `template_subtasks` — template subtask library: template_id, text, sort_order
- `tasks` — work tasks: title, client_id, employee_id, status, template_id
- `subtasks` — task items: task_id, text, done, seconds, notes, sort_order
- `task_checks` — checking records: task_id, check_level, checker_id, status
- `subtask_verifications`, `appointments`, `clients`, `divisions`, `payments`, `dsc_register`, `activity_log`, `leave_requests`, `attendance`

## Role-Based Access
- **Admin**: full access — create tasks, manage templates, approve checks, all pages
- **Manager**: team oversight, Level 2 approvals, appointments, leave approval — CANNOT create tasks
- **Article/Staff**: own tasks only, can do Level 1 checks
- Admin-only pages (`/templates`, `/employees`, `/billing`, `/reports`) redirect non-admins to `/dashboard`
- Navbar links filtered by classification; middleware checks `employee_id` cookie

## Key Architecture Decisions
1. **Template immutability**: Creating a task from a template COPIES subtasks into the `subtasks` table. Template edits never affect existing tasks.
2. **Live subtask editing**: Assigned employees edit their task's subtasks freely (no approval). Never touches the master template.
3. **Auth**: Frontend sends plaintext password → backend hashes/compares with bcrypt (salt=10). Session via cookies; middleware authorizes routes.
4. **Dark mode**: All components use `dark:` prefix; toggle saved to localStorage.

## File Structure
```
/app
  /api/auth/login/route.ts   — login with bcrypt verification
  /api/templates/            — template CRUD
  /api/tasks/                — task creation (copies template subtasks)
  /api/employees/, /clients/, /checks/, ...
  /login, /dashboard, /tasks, /templates (admin), /employees (admin), ...
/components
  Navbar.tsx                 — role-based link filtering
  TaskModal.tsx              — task creation with template dropdown
  EmployeeModal.tsx          — employee CRUD, password visibility toggle
  SubtaskChecklist.tsx       — live subtask editing
/lib
  auth.ts                    — permissions, getNavLinks(), hashPassword()
  utils.ts                   — CLASSIFICATIONS, formatDate, getInitials
  taskTemplates.ts           — template subtask fetching
```

## Task Workflow
1. Admin creates task from template (or custom) → subtasks auto-copied
2. Admin assigns to employee → employee completes subtasks (time, notes)
3. Employee marks done → admin assigns Level 1 checker
4. Level 1 checker verifies subtask-by-subtask → Level 2 manager approves → task approved

## Conventions
- **Code style**: self-documenting (minimal comments), short focused functions, explicit TS types, React hooks
- **Fetch pattern**: try/catch, check `response.ok` before parsing JSON
- **Naming**: pages lowercase-hyphen; components PascalCase; API `/api/resource/[id]/route.ts`
- **DB naming**: tables lowercase_plural, columns snake_case, FKs `{table_singular}_id`

## Common Tasks
**Add admin-only page**: create `/app/newpage/page.tsx`, add useEffect classification check (redirect non-admin to `/dashboard`), add to navbar `navItems` with `adminOnly: true`, add to `middleware.ts` protected routes.

**Create template**: as admin → `/templates` → "+ New Template" → name/category/keyword → add subtasks → save.

**Deploy**: `git push origin main` (Vercel auto-deploys).

**SQL migrations**: run directly in Supabase SQL Editor.

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```
Never commit `.env.local`.

## Commands
```
npm run dev      # dev server (localhost:3000 or 3002)
npm run build    # production build
npm run lint     # ESLint
```

## Known Limitations
- No real-time updates (manual refresh needed)
- No pagination (loads all data — fine for small teams)
- No invoice PDF export, no email notifications
- Dark mode toggle in localStorage only (not DB)

## Security Notes
- Enable RLS on all Supabase tables before production
- bcrypt salt=10 for passwords; backend validates all inputs
- Never commit `.env.local` (contains ANON_KEY)

## New Session Checklist
1. `git log --oneline -10` to see recent work
2. Verify `.env.local` has Supabase vars
3. `npm run dev` → test with akshay/akshay@123 (admin)
4. Test access control: kaarthik on `/templates` should redirect to `/dashboard`

---
**Last Updated**: July 11, 2026 · **Version**: 1.0 (Production Ready)
