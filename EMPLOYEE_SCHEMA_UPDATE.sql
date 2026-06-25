-- Update employees table with additional fields
-- Run this in Supabase SQL Editor to add the new columns

-- Add new columns to employees table
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS classification VARCHAR(50),
ADD COLUMN IF NOT EXISTS specialisation VARCHAR(255),
ADD COLUMN IF NOT EXISTS mobile VARCHAR(20),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS weekly_capacity INTEGER DEFAULT 40,
ADD COLUMN IF NOT EXISTS on_leave BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS avatar_color VARCHAR(7);

-- Update existing test users with sample data
UPDATE employees SET
  classification = 'Senior',
  specialisation = 'Corporate Law',
  mobile = '+91 98765 43210',
  date_of_birth = '1990-05-15'::DATE,
  weekly_capacity = 40,
  avatar_color = '#2a5d8f'
WHERE username = 'ravi';

UPDATE employees SET
  classification = 'Manager',
  specialisation = 'GST / Indirect Tax',
  mobile = '+91 87654 32109',
  date_of_birth = '1988-08-22'::DATE,
  weekly_capacity = 40,
  avatar_color = '#1f7a52'
WHERE username = 'sneha';

-- Verify the updates
SELECT id, username, name, classification, specialisation, mobile, on_leave, avatar_color FROM employees;
