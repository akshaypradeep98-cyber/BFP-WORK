-- Fix existing employees table by adding missing columns and data

-- Add missing columns if they don't exist
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS mobile VARCHAR(20),
ADD COLUMN IF NOT EXISTS classification VARCHAR(50),
ADD COLUMN IF NOT EXISTS specialisation VARCHAR(255),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS weekly_capacity INTEGER DEFAULT 40,
ADD COLUMN IF NOT EXISTS on_leave BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS avatar_color VARCHAR(7);

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_employees_username ON employees(username);

-- Delete old test users if they exist (to re-insert with complete data)
DELETE FROM employees WHERE username IN ('ravi', 'sneha');

-- Insert test users with ALL data
INSERT INTO employees (username, password_hash, name, email, mobile, classification, specialisation, date_of_birth, weekly_capacity, on_leave, avatar_color)
VALUES
(
  'ravi',
  '$2a$10$QCpfSLmJLMSxFkJvR8mN.eYO3EF5NzJKdGfKTNbz8bD1mZR4aJLwa',
  'Ravi Kumar',
  'ravi@firmflow.com',
  '+91 98765 43210',
  'Senior',
  'Corporate Law',
  '1990-05-15'::DATE,
  40,
  FALSE,
  '#2a5d8f'
),
(
  'sneha',
  '$2a$10$R1Xd8hKbL8KpM2nQ9vX5F.uJf1KbN3sR9cL4eM5dP8qS7tU2vW9He',
  'Sneha Patel',
  'sneha@firmflow.com',
  '+91 87654 32109',
  'Manager',
  'GST / Indirect Tax',
  '1988-08-22'::DATE,
  40,
  FALSE,
  '#1f7a52'
);

-- Verify the data
SELECT id, username, name, email, classification, specialisation, mobile, on_leave, avatar_color
FROM employees
ORDER BY id;
