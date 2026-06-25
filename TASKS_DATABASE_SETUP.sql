-- Tasks Database Setup for BFP Work
-- Run this ENTIRE script in Supabase SQL Editor

-- Create divisions table
CREATE TABLE IF NOT EXISTS divisions (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(7) DEFAULT '#1C3350',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL,
  employee_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,
  division_id BIGINT REFERENCES divisions(id) ON DELETE SET NULL,
  due_date DATE,
  amount INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'todo',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_employee_id ON tasks(employee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_division_id ON tasks(division_id);

-- Insert sample divisions
INSERT INTO divisions (name, color) VALUES
('Corporate Law', '#2a5d8f'),
('GST / Indirect Tax', '#1f7a52'),
('Compliance', '#c87a23'),
('Labour Law', '#7a4fa0'),
('Litigation', '#b3392f');

-- Insert sample tasks
INSERT INTO tasks (title, client_id, employee_id, division_id, due_date, amount, status) VALUES
('Contract Review', 1, 1, 1, '2026-06-20', 25000, 'prog'),
('GST Audit', 1, 2, 2, '2026-06-18', 50000, 'todo'),
('Annual Compliance', 2, 1, 3, '2026-07-15', 75000, 'done'),
('Labour Legal Opinion', 2, 2, 4, '2026-06-30', 40000, 'todo'),
('Litigation Support', 1, 1, 5, '2026-06-16', 100000, 'prog');

-- Verify the data
SELECT * FROM divisions;
SELECT
  t.id, t.title, c.name as client, e.name as employee,
  d.name as division, t.due_date, t.amount, t.status
FROM tasks t
LEFT JOIN clients c ON t.client_id = c.id
LEFT JOIN employees e ON t.employee_id = e.id
LEFT JOIN divisions d ON t.division_id = d.id;
