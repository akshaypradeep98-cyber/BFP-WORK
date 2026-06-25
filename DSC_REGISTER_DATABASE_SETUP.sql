-- DSC Register Database Setup for BFP Work
-- Run this in Supabase SQL Editor

-- Create dsc_register table
CREATE TABLE IF NOT EXISTS dsc_register (
  id BIGSERIAL PRIMARY KEY,
  holder_name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,
  expiry_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_dsc_register_expiry_date ON dsc_register(expiry_date);

-- Verify
SELECT * FROM dsc_register;
