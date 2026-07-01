-- Employee RBAC System Setup
-- Run this in Supabase SQL Editor

-- Step 1: Add username and password_hash columns to employees table if they don't exist
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS username VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Step 2: Delete all existing test employees (backup first!)
TRUNCATE TABLE employees RESTART IDENTITY CASCADE;

-- Step 3: Create admin employee (Akshay)
-- Username: akshay
-- Password: akshay@123
INSERT INTO employees (
  name,
  username,
  password_hash,
  classification,
  specialisation,
  capacity,
  on_leave,
  avatar_color,
  created_at,
  updated_at
) VALUES (
  'Akshay',
  'akshay',
  '$2a$10$k6I41XQLZrZc4yAeugQ18ODHDHBP48m7zvAgBXZ1HRo.kvkI./74i',
  'admin',
  'Accounting',
  100,
  false,
  '#3B82F6',
  NOW(),
  NOW()
);

-- Step 4: Create manager employee (Kaarthik)
-- Username: kaarthik
-- Password: kaarthik@123
INSERT INTO employees (
  name,
  username,
  password_hash,
  classification,
  specialisation,
  capacity,
  on_leave,
  avatar_color,
  created_at,
  updated_at
) VALUES (
  'Kaarthik',
  'kaarthik',
  '$2a$10$vjXrOgDaR4rd4Dfg9SaQc.HVxzotYUZoFLxrJmzawIHuTQlZarLKK',
  'manager',
  'Accounting',
  80,
  false,
  '#10B981',
  NOW(),
  NOW()
);

-- Step 5: Verify the setup
SELECT id, name, username, classification FROM employees;

-- Classifications: admin, manager, article, staff
-- Login credentials:
-- akshay / akshay@123 (admin)
-- kaarthik / kaarthik@123 (manager)
