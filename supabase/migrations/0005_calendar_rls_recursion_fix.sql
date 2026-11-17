-- Fixes "infinite recursion detected in policy for relation calendar_events".
-- Cause: calendar_events_select checked event_attendees via a plain
-- subquery, and event_attendees' own policies checked back into
-- calendar_events via a plain subquery. Each subquery runs as the
-- calling role and re-triggers the other table's RLS, so the two
-- policies called each other forever.
--
-- Fix: route both cross-table checks through SECURITY DEFINER helper
-- functions (same pattern as current_employee_id() in 0001). Those run
-- as the function owner, which bypasses RLS, so the chain terminates.

create or replace function public.is_calendar_event_creator(p_event_id bigint)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from calendar_events ce
    where ce.id = p_event_id and ce.created_by = current_employee_id()
  );
$$;

create or replace function public.is_event_attendee(p_event_id bigint)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from event_attendees ea
    where ea.event_id = p_event_id and ea.employee_id = current_employee_id()
  );
$$;

revoke all on function public.is_calendar_event_creator(bigint) from anon, authenticated;
revoke all on function public.is_event_attendee(bigint) from anon, authenticated;
grant execute on function public.is_calendar_event_creator(bigint) to authenticated;
grant execute on function public.is_event_attendee(bigint) to authenticated;

drop policy if exists calendar_events_select on calendar_events;
create policy calendar_events_select on calendar_events
  for select to authenticated
  using (
    is_admin_or_manager()
    or created_by = current_employee_id()
    or is_event_attendee(id)
    or (
      related_task_id is not null
      and exists (
        select 1 from tasks t
        where t.id = calendar_events.related_task_id
          and t.employee_id = current_employee_id()
      )
    )
  );

drop policy if exists event_attendees_select on event_attendees;
create policy event_attendees_select on event_attendees
  for select to authenticated
  using (
    is_admin_or_manager()
    or employee_id = current_employee_id()
    or is_calendar_event_creator(event_id)
  );

drop policy if exists event_attendees_write on event_attendees;
create policy event_attendees_write on event_attendees
  for all to authenticated
  using (is_admin_or_manager() or is_calendar_event_creator(event_id))
  with check (is_admin_or_manager() or is_calendar_event_creator(event_id));
