-- First, let's check what columns exist
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'employees';

-- Add the password_hash column explicitly (if missing)
ALTER TABLE employees
ADD COLUMN password_hash VARCHAR(255);

-- Add other missing columns if needed
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS mobile VARCHAR(20),
ADD COLUMN IF NOT EXISTS classification VARCHAR(50),
ADD COLUMN IF NOT EXISTS specialisation VARCHAR(255),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS weekly_capacity INTEGER DEFAULT 40,
ADD COLUMN IF NOT EXISTS on_leave BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS avatar_color VARCHAR(7);

-- Verify columns were added
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'employees' ORDER BY ordinal_position;
