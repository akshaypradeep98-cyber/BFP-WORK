-- Follow-up to 0001: employees_write restricted UPDATE to admin only,
-- but leave-request approval (manager territory per the app's existing
-- permission model — see lib/auth.ts permissions.canManageTeam) flips
-- employees.on_leave and was blocked for managers.
--
-- This grants manager a general UPDATE on employees, matching the
-- app's existing admin+manager "team management" permission level.
-- INSERT/DELETE (creating/removing employee accounts) stay admin-only.
-- There's no column-level split here (RLS can't do that without another
-- trigger) — the Next.js API routes remain the layer that decides which
-- fields a given action is allowed to touch, as elsewhere in this app.

drop policy if exists employees_write on employees;

create policy employees_admin_all on employees
  for all
  to authenticated
  using (current_employee_role() = 'admin')
  with check (current_employee_role() = 'admin');

create policy employees_manager_update on employees
  for update
  to authenticated
  using (current_employee_role() = 'manager')
  with check (current_employee_role() = 'manager');
