-- Update Employees Table Schema for BFP Work
-- Run this in Supabase SQL Editor

-- Add missing columns to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS classification VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS specialisation VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 40;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS on_leave BOOLEAN DEFAULT FALSE;

-- Verify the schema
SELECT * FROM employees LIMIT 1;
