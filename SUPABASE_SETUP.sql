-- FirmFlow Database Setup Script
-- Copy and paste this entire script into Supabase SQL Editor
-- Navigate to: Supabase Dashboard > SQL Editor > New Query > Paste this script

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups by username
CREATE INDEX IF NOT EXISTS idx_employees_username ON employees(username);

-- Insert test users with pre-hashed passwords
-- These hashes correspond to:
-- ravi@123 -> $2a$10$QCpfSLmJLMSxFkJvR8mN.eYO3EF5NzJKdGfKTNbz8bD1mZR4aJLwa
-- sneha@123 -> $2a$10$R1Xd8hKbL8KpM2nQ9vX5F.uJf1KbN3sR9cL4eM5dP8qS7tU2vW9He

DELETE FROM employees WHERE username IN ('ravi', 'sneha');

INSERT INTO employees (username, password_hash, name, email) VALUES
(
  'ravi',
  '$2a$10$QCpfSLmJLMSxFkJvR8mN.eYO3EF5NzJKdGfKTNbz8bD1mZR4aJLwa',
  'Ravi Kumar',
  'ravi@firmflow.com'
),
(
  'sneha',
  '$2a$10$R1Xd8hKbL8KpM2nQ9vX5F.uJf1KbN3sR9cL4eM5dP8qS7tU2vW9He',
  'Sneha Patel',
  'sneha@firmflow.com'
);

-- Verify the data was inserted
SELECT id, username, name, email FROM employees;
