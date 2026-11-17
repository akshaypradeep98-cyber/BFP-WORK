-- Links employees to Supabase Auth and enables RLS on employees/tasks.
-- Review before running. Apply with: npx supabase db push --remote
--
-- Scope: this migration covers `employees` and `tasks` only, matching the
-- original requirement. task_checks, subtask_verifications, appointments
-- and payments are NOT covered yet — they still rely on the Next.js
-- middleware/API-route checks for access control. Treat that as a known
-- gap to close in a follow-up migration, not an oversight.

-- 1. Link each employee row to a Supabase Auth user.
alter table employees
  add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;

-- 2. Helper functions used by RLS policies below.
-- security definer + fixed search_path so they can read `employees` even
-- though RLS will otherwise lock that table down, and so they can't be
-- hijacked via a session-local search_path.
create or replace function public.current_employee_id()
returns bigint
language sql
security definer
stable
set search_path = public
as $$
  select id from employees where auth_user_id = auth.uid();
$$;

create or replace function public.current_employee_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select classification from employees where auth_user_id = auth.uid();
$$;

create or replace function public.is_admin_or_manager()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(current_employee_role(), '') in ('admin', 'manager');
$$;

revoke all on function public.current_employee_id() from anon, authenticated;
revoke all on function public.current_employee_role() from anon, authenticated;
revoke all on function public.is_admin_or_manager() from anon, authenticated;
grant execute on function public.current_employee_id() to authenticated;
grant execute on function public.current_employee_role() to authenticated;
grant execute on function public.is_admin_or_manager() to authenticated;

-- 3. Total headcount: callable by anyone, but only returns a number for
-- admin/manager. Everyone else gets an error, never a count or a null
-- they could treat as zero.
create or replace function public.get_total_employees()
returns integer
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not is_admin_or_manager() then
    raise exception 'insufficient_privilege: employee count is restricted to admin/manager';
  end if;
  return (select count(*)::integer from employees);
end;
$$;

revoke all on function public.get_total_employees() from anon, authenticated;
grant execute on function public.get_total_employees() to authenticated;

-- 4. Lock down direct table access. The anon role no longer has any use
-- for these two tables once login goes through Supabase Auth.
revoke all on employees from anon;
revoke all on tasks from anon;
grant select, insert, update, delete on employees to authenticated;
grant select, insert, update, delete on tasks to authenticated;
-- SERIAL/BIGSERIAL sequences need explicit usage grants for INSERT to work
-- under RLS when the caller is `authenticated`, not the table owner.
grant usage, select on sequence employees_id_seq to authenticated;
grant usage, select on sequence tasks_id_seq to authenticated;

alter table employees enable row level security;
alter table employees force row level security;
alter table tasks enable row level security;
alter table tasks force row level security;

-- 5. employees policies.
drop policy if exists employees_select on employees;
create policy employees_select on employees
  for select
  to authenticated
  using (
    auth_user_id = auth.uid()
    or is_admin_or_manager()
  );

-- Employee creation/editing stays admin-only, matching the current app
-- rules (see lib/auth.ts permissions.canViewAllEmployees).
drop policy if exists employees_write on employees;
create policy employees_write on employees
  for all
  to authenticated
  using (current_employee_role() = 'admin')
  with check (current_employee_role() = 'admin');

-- 6. tasks policies.
drop policy if exists tasks_select on tasks;
create policy tasks_select on tasks
  for select
  to authenticated
  using (
    employee_id = current_employee_id()
    or is_admin_or_manager()
  );

-- Only admin creates/deletes tasks (matches lib/auth.ts canAllocateTasks).
drop policy if exists tasks_insert on tasks;
create policy tasks_insert on tasks
  for insert
  to authenticated
  with check (current_employee_role() = 'admin');

drop policy if exists tasks_delete on tasks;
create policy tasks_delete on tasks
  for delete
  to authenticated
  using (current_employee_role() = 'admin');

-- Admin/manager can update any task; the owning employee can update only
-- their own task, and only the status field (everything else must be
-- unchanged) — enforced by the trigger below since RLS alone can't
-- restrict which columns change within an allowed row.
drop policy if exists tasks_update on tasks;
create policy tasks_update on tasks
  for update
  to authenticated
  using (
    employee_id = current_employee_id()
    or is_admin_or_manager()
  )
  with check (
    employee_id = current_employee_id()
    or is_admin_or_manager()
  );

create or replace function public.enforce_task_update_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if is_admin_or_manager() then
    return new;
  end if;

  -- Non-admin/manager callers may only ever touch their own task, and may
  -- only change its status.
  if old.employee_id is distinct from current_employee_id() then
    raise exception 'insufficient_privilege: not your task';
  end if;

  if new.title is distinct from old.title
    or new.client_id is distinct from old.client_id
    or new.employee_id is distinct from old.employee_id
    or new.division_id is distinct from old.division_id
    or new.due_date is distinct from old.due_date
    or new.amount is distinct from old.amount
    or new.template_id is distinct from old.template_id
  then
    raise exception 'insufficient_privilege: employees may only change task status';
  end if;

  return new;
end;
$$;

drop trigger if exists tasks_enforce_update_scope on tasks;
create trigger tasks_enforce_update_scope
  before update on tasks
  for each row
  execute function public.enforce_task_update_scope();
