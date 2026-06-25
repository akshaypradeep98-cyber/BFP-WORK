-- Add check_status column to tasks table
ALTER TABLE tasks ADD COLUMN check_status VARCHAR(50) DEFAULT 'pending' CHECK (check_status IN ('pending', 'checking_level1', 'checking_level2', 'checking_level3', 'approved', 'rejected'));

-- Create task_checks table
CREATE TABLE task_checks (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  checker_id INTEGER NOT NULL REFERENCES employees(id),
  level INTEGER NOT NULL CHECK (level IN (1, 2, 3)),
  status VARCHAR(50) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'approved', 'rejected')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create subtask_verifications table
CREATE TABLE subtask_verifications (
  id SERIAL PRIMARY KEY,
  subtask_id INTEGER NOT NULL REFERENCES subtasks(id) ON DELETE CASCADE,
  task_check_id INTEGER NOT NULL REFERENCES task_checks(id) ON DELETE CASCADE,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_task_checks_task_id ON task_checks(task_id);
CREATE INDEX idx_task_checks_checker_id ON task_checks(checker_id);
CREATE INDEX idx_task_checks_level ON task_checks(level);
CREATE INDEX idx_subtask_verifications_subtask_id ON subtask_verifications(subtask_id);
CREATE INDEX idx_subtask_verifications_task_check_id ON subtask_verifications(task_check_id);
