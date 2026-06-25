-- Add updated_at column to tasks table
ALTER TABLE tasks ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();

-- Update existing rows to have an updated_at value
UPDATE tasks SET updated_at = COALESCE(updated_at, NOW()) WHERE updated_at IS NULL;

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at);
