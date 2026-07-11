-- Update Divisions Table
-- First, clear division_id from tasks that reference old divisions
UPDATE tasks SET division_id = NULL WHERE division_id IS NOT NULL;

-- Delete existing divisions
DELETE FROM divisions;

-- Add new divisions
INSERT INTO divisions (name, color) VALUES
  ('BFP', '#7c3aed'),
  ('VKR & Co', '#ec4899'),
  ('Virtual CFO', '#10b981');
