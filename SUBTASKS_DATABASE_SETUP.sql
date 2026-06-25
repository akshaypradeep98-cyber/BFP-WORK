-- Subtasks Database Setup for BFP Work
-- Run this in Supabase SQL Editor

-- Create subtasks table
CREATE TABLE IF NOT EXISTS subtasks (
  id BIGSERIAL PRIMARY KEY,
  task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  done BOOLEAN DEFAULT FALSE,
  seconds INTEGER DEFAULT 0,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_sort_order ON subtasks(task_id, sort_order);

-- Insert sample subtasks for the GST Audit task (task_id=2)
INSERT INTO subtasks (task_id, title, done, seconds, sort_order) VALUES
(2, 'Collect sales and purchase registers', FALSE, 0, 0),
(2, 'Reconcile GSTR-2B with books', FALSE, 1200, 1),
(2, 'Prepare GSTR-1', FALSE, 0, 2),
(2, 'Match input tax credit', FALSE, 900, 3),
(2, 'Compute tax liability', FALSE, 0, 4),
(2, 'Make tax payment', FALSE, 0, 5),
(2, 'File GSTR-3B', FALSE, 0, 6),
(2, 'Share filing acknowledgement', FALSE, 0, 7);

-- Verify
SELECT * FROM subtasks WHERE task_id = 2 ORDER BY sort_order;
