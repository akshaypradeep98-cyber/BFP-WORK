-- When a Level 2 checker sends a task back, they choose whether the
-- staff member's resend restarts at a Level 1 check (1) or goes straight
-- back to Level 2 (2). NULL on every other check row.
ALTER TABLE task_checks ADD COLUMN IF NOT EXISTS resend_level INTEGER
  CHECK (resend_level IN (1, 2));
