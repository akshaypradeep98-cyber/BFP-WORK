-- Payments Database Setup for BFP Work
-- Run this in Supabase SQL Editor

-- Add expense column to tasks table if not exists
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS expense INTEGER DEFAULT 0;

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  payment_date DATE NOT NULL,
  mode VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_payments_task_id ON payments(task_id);

-- Verify
SELECT * FROM payments;
