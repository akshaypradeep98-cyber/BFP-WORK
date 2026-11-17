-- notes_select (0004) never defined visibility for a standalone shared
-- note (is_private = false, no task_id, no event_id) — it fell through
-- every branch and was invisible to everyone but its own creator,
-- contradicting "shared" notes being meant for the team to see.

drop policy if exists notes_select on notes;
create policy notes_select on notes
  for select to authenticated
  using (
    created_by = current_employee_id()
    or (
      is_private = false
      and (
        is_admin_or_manager()
        or (task_id is null and event_id is null)
        or (task_id is not null and exists (
          select 1 from tasks t where t.id = notes.task_id and t.employee_id = current_employee_id()
        ))
        or (event_id is not null and exists (
          select 1 from calendar_events ce where ce.id = notes.event_id
        ))
      )
    )
  );
