-- Check what columns currently exist in the employees table
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'employees'
ORDER BY ordinal_position;

-- Also check how many rows exist
SELECT COUNT(*) as total_employees FROM employees;

-- See all current data
SELECT * FROM employees;
