-- BFP Work: consolidated schema matching the live Supabase project (verified 2026-11-16)
-- Safe to run on an empty project. On the live project every statement is a no-op.
-- Run SEED_TEMPLATES.sql afterwards to load the CA task templates.

CREATE TABLE IF NOT EXISTS employees (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  mobile VARCHAR(20),
  classification VARCHAR(50),          -- admin | manager | article | staff
  specialisation VARCHAR(255),
  date_of_birth DATE,
  weekly_capacity INTEGER DEFAULT 40,  -- the column the app reads and edits
  capacity INTEGER DEFAULT 40,         -- legacy, unused by the app
  on_leave BOOLEAN DEFAULT FALSE,
  avatar_color VARCHAR(7),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS divisions (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(7) DEFAULT '#1C3350',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clients (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  mobile VARCHAR(20),
  lead_employee_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_kmp (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  designation VARCHAR(255),
  mobile VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_templates (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  keyword VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS template_subtasks (
  id BIGSERIAL PRIMARY KEY,
  template_id BIGINT NOT NULL REFERENCES task_templates(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tasks (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL,
  employee_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,
  division_id BIGINT REFERENCES divisions(id) ON DELETE SET NULL,
  template_id BIGINT REFERENCES task_templates(id) ON DELETE SET NULL,
  due_date DATE,
  amount INTEGER DEFAULT 0,
  expense INTEGER DEFAULT 0,
  tax_period VARCHAR(10) DEFAULT '25-26',
  status VARCHAR(50) DEFAULT 'todo',          -- todo | prog | done
  check_status VARCHAR(50) DEFAULT 'pending', -- pending | waiting_for_checker | checking_level1 | checking_level2 | approved | rejected
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subtasks (
  id BIGSERIAL PRIMARY KEY,
  task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  done BOOLEAN DEFAULT FALSE,
  seconds INTEGER DEFAULT 0,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  last_logged TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_checks (
  id BIGSERIAL PRIMARY KEY,
  task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  checker_id BIGINT NOT NULL REFERENCES employees(id),
  check_level INTEGER NOT NULL,                      -- 1 | 2
  status VARCHAR(50) NOT NULL DEFAULT 'in_progress', -- in_progress | approved | rejected | reassigned
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  resend_level INTEGER CHECK (resend_level IN (1, 2)) -- Level 2 rejections only: where the staff resend goes
);

CREATE TABLE IF NOT EXISTS subtask_verifications (
  id BIGSERIAL PRIMARY KEY,
  subtask_id BIGINT NOT NULL REFERENCES subtasks(id) ON DELETE CASCADE,
  check_id BIGINT NOT NULL REFERENCES task_checks(id) ON DELETE CASCADE,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointments (
  id BIGSERIAL PRIMARY KEY,
  task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES employees(id),
  manager_id BIGINT NOT NULL REFERENCES employees(id),
  check_type VARCHAR(50) NOT NULL,                 -- level1_check | level2_approval
  status VARCHAR(50) NOT NULL DEFAULT 'requested', -- requested | accepted | confirmed | completed | declined
  scheduled_at TIMESTAMP,                          -- API exposes it as appointment_date + appointment_time
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  payment_date DATE NOT NULL,
  mode VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  approved_by BIGINT REFERENCES employees(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  login_at TIMESTAMP NOT NULL,
  logout_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Dated history of time logged on steps (seconds = change; resets are negative)
CREATE TABLE IF NOT EXISTS time_entries (
  id BIGSERIAL PRIMARY KEY,
  task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  subtask_id BIGINT REFERENCES subtasks(id) ON DELETE SET NULL,
  employee_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,
  seconds INTEGER NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS activity_log (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  detail TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dsc_register (
  id BIGSERIAL PRIMARY KEY,
  holder_name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,
  expiry_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Firm's own bank accounts. Visible to every employee; add/delete is
-- admin-only (enforced in middleware.ts via ADMIN_WRITE_APIS), same as
-- dsc_register.
CREATE TABLE IF NOT EXISTS bank_accounts (
  id BIGSERIAL PRIMARY KEY,
  bank_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Which firm bank account a payment was received into. Added after
-- bank_accounts so the FK target exists; IF NOT EXISTS makes this a
-- no-op on deployments that already have the column.
ALTER TABLE payments ADD COLUMN IF NOT EXISTS bank_account_id BIGINT REFERENCES bank_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_employee_id ON tasks(employee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_template_id ON tasks(template_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_task_checks_task_id ON task_checks(task_id);
CREATE INDEX IF NOT EXISTS idx_template_subtasks_template_id ON template_subtasks(template_id);
CREATE INDEX IF NOT EXISTS idx_appointments_manager_id ON appointments(manager_id);
