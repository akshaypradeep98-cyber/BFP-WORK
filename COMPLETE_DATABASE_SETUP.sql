-- COMPLETE BFP Work Database Setup
-- Run this ENTIRE script in Supabase SQL Editor (copy all and run once)
-- This creates the employees table with ALL columns and inserts test users

-- Drop the old table if it exists (CAREFUL - this deletes all data)
DROP TABLE IF EXISTS employees CASCADE;

-- Create the complete employees table
CREATE TABLE employees (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  mobile VARCHAR(20),
  classification VARCHAR(50),
  specialisation VARCHAR(255),
  date_of_birth DATE,
  weekly_capacity INTEGER DEFAULT 40,
  on_leave BOOLEAN DEFAULT FALSE,
  avatar_color VARCHAR(7),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX idx_employees_username ON employees(username);

-- Insert test users with VERIFIED bcrypt hashes (confirmed to match passwords)
-- ravi@123  -> $2a$10$ya2.gODbW4ZK1GMt25aDouT8yN0x7xncWoSPP6oTkUI79jDLijKE2
-- sneha@123 -> $2a$10$EXOXo64AkYwp0v31vfpa4.92kZE28B6Q2r.5GfFyq.qcMzlWweUPW

INSERT INTO employees (username, password_hash, name, email, mobile, classification, specialisation, date_of_birth, weekly_capacity, on_leave, avatar_color) VALUES
(
  'ravi',
  '$2a$10$ya2.gODbW4ZK1GMt25aDouT8yN0x7xncWoSPP6oTkUI79jDLijKE2',
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
  '$2a$10$EXOXo64AkYwp0v31vfpa4.92kZE28B6Q2r.5GfFyq.qcMzlWweUPW',
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

-- Verify the data was inserted
SELECT id, username, name, email, classification, specialisation, mobile, on_leave FROM employees;
