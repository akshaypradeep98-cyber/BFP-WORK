-- Follow-up to 0001: the checking workflow needs a Level 1/2 checker to
-- see the full task they're checking, even when it belongs to a
-- different employee. Without this, the tasks_select policy from 0001
-- breaks /api/checks/level1 and /api/checks/level2 for any checker who
-- isn't admin/manager, since those routes look up the task behind each
-- pending check.

drop policy if exists tasks_select on tasks;
create policy tasks_select on tasks
  for select
  to authenticated
  using (
    employee_id = current_employee_id()
    or is_admin_or_manager()
    or exists (
      select 1
      from task_checks tc
      where tc.task_id = tasks.id
        and tc.checker_id = current_employee_id()
    )
  );
