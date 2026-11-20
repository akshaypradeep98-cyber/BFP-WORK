-- The check workflow (Level 1/2 approve, reject) updates tasks.check_status
-- server-side with the service-role key, because the checker usually isn't
-- the task's assignee. That request has no auth.uid(), so
-- enforce_task_update_scope rejected it as "not your task" and every
-- approve/reject left the task stuck at its old stage. Trusted server
-- callers (the service role over the API) now pass through; user sessions
-- are checked as before.
create or replace function public.enforce_task_update_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') = 'service_role' then
    return new;
  end if;

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

-- A Level 1 approval whose task update was blocked never created its
-- Level 2 check. Reopen those Level 1 checks (verification ticks are kept)
-- so the checker can approve again and pick the Level 2 checker.
with latest as (
  select distinct on (task_id) id, check_level, status
  from task_checks
  where status <> 'reassigned'
  order by task_id, created_at desc, id desc
)
update task_checks c
set status = 'in_progress', approved_at = null
from latest l
where c.id = l.id and l.check_level = 1 and l.status = 'approved';

-- Repair tasks whose stage was left behind by the blocked updates: set
-- each task's stage from its latest (non-reassigned) check. The scope
-- trigger is paused for this one-off repair (it has no user session) and
-- re-enabled straight after, inside this migration's transaction.
alter table tasks disable trigger tasks_enforce_update_scope;

with latest as (
  select distinct on (task_id) task_id, check_level, status
  from task_checks
  where status <> 'reassigned'
  order by task_id, created_at desc, id desc
)
update tasks t
set
  check_status = case
    when l.status = 'rejected' then 'rejected'
    when l.status = 'in_progress' then 'checking_level' || l.check_level
    when l.status = 'approved' and l.check_level = 2 then 'approved'
    when l.status = 'approved' and l.check_level = 1 then 'checking_level2'
    else t.check_status
  end,
  status = case when l.status = 'rejected' then 'prog' else t.status end
from latest l
where l.task_id = t.id
  and t.check_status is distinct from case
    when l.status = 'rejected' then 'rejected'
    when l.status = 'in_progress' then 'checking_level' || l.check_level
    when l.status = 'approved' and l.check_level = 2 then 'approved'
    when l.status = 'approved' and l.check_level = 1 then 'checking_level2'
    else t.check_status
  end;

alter table tasks enable trigger tasks_enforce_update_scope;
