-- Calendar module: configurable event types, events (with recurrence),
-- attendees, per-occurrence exceptions, reminders, and notes.
-- Review before running. Apply with: npx supabase db push --remote
--
-- Reuses the role helpers from 0001 (current_employee_id, current_employee_role,
-- is_admin_or_manager) rather than introducing new role logic.

create table if not exists event_types (
  id bigserial primary key,
  name varchar(100) not null unique,
  color varchar(7) not null default '#7c3aed',
  created_at timestamptz default now()
);

insert into event_types (name, color) values
  ('Meeting', '#7c3aed'),
  ('Deadline', '#ef4444'),
  ('Audit', '#f59e0b'),
  ('Filing', '#10b981'),
  ('Leave', '#f97316'),
  ('Review', '#ec4899')
on conflict (name) do nothing;

create table if not exists calendar_events (
  id bigserial primary key,
  title varchar(255) not null,
  description text,
  event_type_id bigint references event_types(id) on delete set null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  all_day boolean default false,
  location text,
  created_by bigint not null references employees(id) on delete cascade,
  related_task_id bigint references tasks(id) on delete set null,
  priority varchar(20) default 'normal',
  status varchar(20) default 'scheduled',
  -- recurrence: null = one-off. 'daily' | 'weekly' | 'monthly' expanded
  -- virtually at read time up to recurrence_end (not materialized per row).
  recurrence_rule varchar(20),
  recurrence_end timestamptz,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint calendar_events_end_after_start check (end_at >= start_at)
);

create index if not exists calendar_events_created_by_idx on calendar_events(created_by);
create index if not exists calendar_events_related_task_idx on calendar_events(related_task_id);
create index if not exists calendar_events_start_idx on calendar_events(start_at);

-- One row per edited/cancelled occurrence of a recurring event, keyed by
-- the occurrence's original start time. Lets "edit this one" happen
-- without materializing every future occurrence as its own row.
create table if not exists event_exceptions (
  id bigserial primary key,
  event_id bigint not null references calendar_events(id) on delete cascade,
  occurrence_start timestamptz not null,
  cancelled boolean default false,
  override_title varchar(255),
  override_start_at timestamptz,
  override_end_at timestamptz,
  created_at timestamptz default now(),
  unique (event_id, occurrence_start)
);

create table if not exists event_attendees (
  id bigserial primary key,
  event_id bigint not null references calendar_events(id) on delete cascade,
  employee_id bigint not null references employees(id) on delete cascade,
  created_at timestamptz default now(),
  unique (event_id, employee_id)
);

create table if not exists event_reminders (
  id bigserial primary key,
  event_id bigint not null references calendar_events(id) on delete cascade,
  remind_minutes_before integer not null,
  -- delivery channel is structured now so email can be added later
  -- without a schema change; only 'in_app' is actually sent today.
  channel varchar(20) not null default 'in_app',
  created_at timestamptz default now()
);

create table if not exists notes (
  id bigserial primary key,
  content text not null,
  is_private boolean default false,
  created_by bigint not null references employees(id) on delete cascade,
  note_date date,
  task_id bigint references tasks(id) on delete cascade,
  event_id bigint references calendar_events(id) on delete cascade,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint notes_content_length check (char_length(content) <= 10000)
);

create index if not exists notes_created_by_idx on notes(created_by);
create index if not exists notes_task_idx on notes(task_id);
create index if not exists notes_event_idx on notes(event_id);

-- Grants: authenticated only, RLS below does the real scoping.
revoke all on event_types from anon;
revoke all on calendar_events from anon;
revoke all on event_exceptions from anon;
revoke all on event_attendees from anon;
revoke all on event_reminders from anon;
revoke all on notes from anon;

grant select on event_types to authenticated;
grant insert, update, delete on event_types to authenticated;
grant select, insert, update, delete on calendar_events to authenticated;
grant select, insert, update, delete on event_exceptions to authenticated;
grant select, insert, update, delete on event_attendees to authenticated;
grant select, insert, update, delete on event_reminders to authenticated;
grant select, insert, update, delete on notes to authenticated;

grant usage, select on sequence event_types_id_seq to authenticated;
grant usage, select on sequence calendar_events_id_seq to authenticated;
grant usage, select on sequence event_exceptions_id_seq to authenticated;
grant usage, select on sequence event_attendees_id_seq to authenticated;
grant usage, select on sequence event_reminders_id_seq to authenticated;
grant usage, select on sequence notes_id_seq to authenticated;

alter table event_types enable row level security;
alter table event_types force row level security;
alter table calendar_events enable row level security;
alter table calendar_events force row level security;
alter table event_exceptions enable row level security;
alter table event_exceptions force row level security;
alter table event_attendees enable row level security;
alter table event_attendees force row level security;
alter table event_reminders enable row level security;
alter table event_reminders force row level security;
alter table notes enable row level security;
alter table notes force row level security;

-- event_types: everyone can read the taxonomy; only admin edits it.
create policy event_types_select on event_types
  for select to authenticated using (true);

create policy event_types_write on event_types
  for all to authenticated
  using (current_employee_role() = 'admin')
  with check (current_employee_role() = 'admin');

-- calendar_events: visible to admin/manager, the creator, an invited
-- attendee, or (for task-linked events) the employee that task is
-- assigned to — so a task deadline shows on the assignee's calendar
-- even if they didn't create the event.
create policy calendar_events_select on calendar_events
  for select to authenticated
  using (
    is_admin_or_manager()
    or created_by = current_employee_id()
    or exists (
      select 1 from event_attendees ea
      where ea.event_id = calendar_events.id
        and ea.employee_id = current_employee_id()
    )
    or (
      related_task_id is not null
      and exists (
        select 1 from tasks t
        where t.id = calendar_events.related_task_id
          and t.employee_id = current_employee_id()
      )
    )
  );

-- Anyone can create their own personal event; admin/manager can create
-- and assign events to anyone.
create policy calendar_events_insert on calendar_events
  for insert to authenticated
  with check (
    created_by = current_employee_id()
    or is_admin_or_manager()
  );

create policy calendar_events_update on calendar_events
  for update to authenticated
  using (created_by = current_employee_id() or is_admin_or_manager())
  with check (created_by = current_employee_id() or is_admin_or_manager());

create policy calendar_events_delete on calendar_events
  for delete to authenticated
  using (created_by = current_employee_id() or is_admin_or_manager());

-- event_exceptions follow the parent event's write access.
create policy event_exceptions_select on event_exceptions
  for select to authenticated
  using (
    exists (
      select 1 from calendar_events ce
      where ce.id = event_exceptions.event_id
    )
  );

create policy event_exceptions_write on event_exceptions
  for all to authenticated
  using (
    exists (
      select 1 from calendar_events ce
      where ce.id = event_exceptions.event_id
        and (ce.created_by = current_employee_id() or is_admin_or_manager())
    )
  )
  with check (
    exists (
      select 1 from calendar_events ce
      where ce.id = event_exceptions.event_id
        and (ce.created_by = current_employee_id() or is_admin_or_manager())
    )
  );

-- event_attendees: visible to admin/manager, the event's creator, or the
-- attendee themselves (so you can see who else is invited to something
-- you're invited to, without seeing attendee lists on events you have no
-- relation to).
create policy event_attendees_select on event_attendees
  for select to authenticated
  using (
    is_admin_or_manager()
    or employee_id = current_employee_id()
    or exists (
      select 1 from calendar_events ce
      where ce.id = event_attendees.event_id and ce.created_by = current_employee_id()
    )
  );

create policy event_attendees_write on event_attendees
  for all to authenticated
  using (
    is_admin_or_manager()
    or exists (
      select 1 from calendar_events ce
      where ce.id = event_attendees.event_id and ce.created_by = current_employee_id()
    )
  )
  with check (
    is_admin_or_manager()
    or exists (
      select 1 from calendar_events ce
      where ce.id = event_attendees.event_id and ce.created_by = current_employee_id()
    )
  );

-- event_reminders: only the event's own creator (or admin/manager) manages them.
create policy event_reminders_all on event_reminders
  for all to authenticated
  using (
    is_admin_or_manager()
    or exists (
      select 1 from calendar_events ce
      where ce.id = event_reminders.event_id and ce.created_by = current_employee_id()
    )
  )
  with check (
    is_admin_or_manager()
    or exists (
      select 1 from calendar_events ce
      where ce.id = event_reminders.event_id and ce.created_by = current_employee_id()
    )
  );

-- notes: a private note is visible ONLY to its creator, even for admin —
-- "private" means private. A shared note is visible to admin/manager,
-- the creator, and (if linked to a task) the employee that task belongs
-- to, and (if linked to an event) anyone who can see that event.
create policy notes_select on notes
  for select to authenticated
  using (
    created_by = current_employee_id()
    or (
      is_private = false
      and (
        is_admin_or_manager()
        or (task_id is not null and exists (
          select 1 from tasks t where t.id = notes.task_id and t.employee_id = current_employee_id()
        ))
        or (event_id is not null and exists (
          select 1 from calendar_events ce where ce.id = notes.event_id
        ))
      )
    )
  );

create policy notes_insert on notes
  for insert to authenticated
  with check (created_by = current_employee_id());

create policy notes_update on notes
  for update to authenticated
  using (created_by = current_employee_id() or is_admin_or_manager())
  with check (created_by = current_employee_id() or is_admin_or_manager());

create policy notes_delete on notes
  for delete to authenticated
  using (created_by = current_employee_id() or is_admin_or_manager());
