-- Add tax_period column to tasks table
ALTER TABLE tasks ADD COLUMN tax_period VARCHAR(10) DEFAULT '25-26';

-- Create index for tax period queries
CREATE INDEX IF NOT EXISTS idx_tasks_tax_period ON tasks(tax_period);
