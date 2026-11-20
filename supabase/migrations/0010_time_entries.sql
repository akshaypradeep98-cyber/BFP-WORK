-- Every change to a step's logged time (stopwatch stop, manual minutes,
-- reset) is recorded as a dated entry, so time can be reported per day.
-- subtasks.seconds stays the running total; this is the history behind it.
-- seconds is the change, so a reset is a negative entry.
CREATE TABLE IF NOT EXISTS time_entries (
  id BIGSERIAL PRIMARY KEY,
  task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  subtask_id BIGINT REFERENCES subtasks(id) ON DELETE SET NULL,
  employee_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,
  seconds INTEGER NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_time_entries_logged_at ON time_entries(logged_at);
CREATE INDEX IF NOT EXISTS idx_time_entries_task_id ON time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_attendance_login_at ON attendance(login_at);

-- Server routes write and read this with the service role; nobody reads it
-- directly from the browser.
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
