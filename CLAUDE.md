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
- `subtasks` — task items: task_id, title, done, seconds, notes, sort_order, last_logged
- `task_checks` — checking records: task_id, check_level, checker_id, status, notes (no updated_at column)
- `subtask_verifications` — subtask_id, check_id, verified, verified_at
- `appointments` — task_id, employee_id, manager_id, check_type, status, scheduled_at, completed_at (API maps scheduled_at to appointment_date/appointment_time)
- `clients`, `client_kmp`, `divisions`, `payments`, `dsc_register`, `activity_log`, `leave_requests`, `attendance`
- Full reference that matches the live project: `DATABASE_SCHEMA.sql`. The other `*_SETUP.sql` files are historical and partly out of date.

## Role-Based Access
- **Admin**: full access — create tasks, manage templates, approve checks, all pages
- **Manager**: team oversight, Level 2 approvals, appointments, leave approval — CANNOT create tasks
- **Article/Staff**: own tasks only, can do Level 1 checks
- Admin-only pages (`/templates`, `/employees`, `/billing`, `/reports`, `/invoices`, `/dsc`, `/activity`) redirect non-admins to `/dashboard`; `/check/level2` and `/manager/*` need manager or admin
- `middleware.ts` enforces this server-side on every page and API route (401/403 for APIs, redirect for pages). It deliberately has NO `config.matcher` export: Next 15.5 silently skipped the middleware when one was present, so static paths are filtered inside the function.
- Navbar links come from `getNavLinks()` in `lib/auth.ts` and are rendered by `components/NavbarRefined.tsx` on every page
- Employee API responses never include `password_hash` (`omitPasswordHash()` in `lib/auth.ts`)

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
  /tasks/components/TaskModal.tsx            — task creation with template dropdown
  /tasks/[id]/components/SubtaskChecklist.tsx — live subtask editing
  /employees/components/EmployeeModal.tsx    — employee CRUD, password visibility toggle
/components
  NavbarRefined.tsx          — global navbar, links from getNavLinks()
  WhatsAppNotificationModal.tsx
/lib
  auth.ts                    — permissions, getNavLinks(), hashPassword(), omitPasswordHash()
  appointments.ts            — scheduled_at <-> appointment_date/time mapping
  utils.ts                   — CLASSIFICATIONS, formatDate, getInitials
  taskTemplates.ts           — keyword-based fallback checklists when no template is chosen
middleware.ts                — auth + role enforcement for pages and APIs
DATABASE_SCHEMA.sql          — consolidated schema (matches live Supabase)
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
**Add admin-only page**: create `/app/newpage/page.tsx` rendering `<NavbarRefined />`, add its path to `ADMIN_PAGES` in `middleware.ts`, and add the link to `adminLinks` in `getNavLinks()` (`lib/auth.ts`). Admin-only API writes go in `ADMIN_WRITE_APIS`.

**Seed a fresh Supabase project**: run `DATABASE_SCHEMA.sql`, then `SEED_TEMPLATES.sql`, then create users via `/employees` as admin (or `scripts/generate-password-hashes.js` for SQL inserts).

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
npm run dev -- -p 3002   # port 3000 is usually held by an unrelated Docker project on this machine
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
**Last Updated**: November 16, 2026 · **Version**: 1.1 (full audit; see git log)
