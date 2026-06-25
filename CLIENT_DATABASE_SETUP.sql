-- Client Master Database Setup for BFP Work
-- Run this ENTIRE script in Supabase SQL Editor

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  mobile VARCHAR(20),
  lead_employee_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create client_kmp (Key Managerial Persons) table
CREATE TABLE IF NOT EXISTS client_kmp (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  designation VARCHAR(255),
  mobile VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_lead_employee_id ON clients(lead_employee_id);
CREATE INDEX IF NOT EXISTS idx_client_kmp_client_id ON client_kmp(client_id);

-- Insert sample clients
INSERT INTO clients (name, type, mobile, lead_employee_id, address) VALUES
(
  'ABC Pvt Ltd',
  'Pvt Ltd',
  '+91 98765 43210',
  1,
  '123 Business Park, Mumbai, Maharashtra'
),
(
  'XYZ LLP',
  'LLP',
  '+91 87654 32109',
  2,
  '456 Corporate Tower, Delhi, NCR'
);

-- Insert sample KMPs for first client
INSERT INTO client_kmp (client_id, name, designation, mobile) VALUES
(1, 'John Doe', 'Director', '+91 99999 88888'),
(1, 'Jane Smith', 'Manager', '+91 88888 77777');

-- Insert sample KMPs for second client
INSERT INTO client_kmp (client_id, name, designation, mobile) VALUES
(2, 'Robert Brown', 'Partner', '+91 77777 66666');

-- Verify the data
SELECT c.id, c.name, c.type, c.mobile, e.name as lead_employee FROM clients c
LEFT JOIN employees e ON c.lead_employee_id = e.id;

SELECT * FROM client_kmp;
