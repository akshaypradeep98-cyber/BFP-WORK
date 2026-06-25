-- Update Subtasks Table Schema for BFP Work
-- Run this in Supabase SQL Editor

-- Add last_logged column to subtasks table
ALTER TABLE subtasks ADD COLUMN IF NOT EXISTS last_logged TIMESTAMP;

-- Verify
SELECT * FROM subtasks LIMIT 1;
