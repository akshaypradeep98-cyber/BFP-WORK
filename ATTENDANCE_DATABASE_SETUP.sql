-- Create attendance table for tracking login/logout sessions
CREATE TABLE IF NOT EXISTS attendance (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  login_at TIMESTAMP NOT NULL,
  logout_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_login_at ON attendance(login_at DESC);

-- Insert test attendance records
INSERT INTO attendance (employee_id, login_at, logout_at) VALUES
  (1, '2026-06-17 09:30:00', '2026-06-17 17:45:00'),
  (2, '2026-06-17 09:00:00', '2026-06-17 18:15:00'),
  (3, '2026-06-17 10:15:00', NULL),
  (1, '2026-06-16 09:45:00', '2026-06-16 17:30:00'),
  (2, '2026-06-16 09:15:00', '2026-06-16 18:00:00'),
  (3, '2026-06-16 10:00:00', '2026-06-16 17:15:00'),
  (1, '2026-06-15 09:00:00', '2026-06-15 17:45:00'),
  (2, '2026-06-15 08:45:00', '2026-06-15 17:00:00'),
  (3, '2026-06-15 10:30:00', '2026-06-15 18:30:00'),
  (1, '2026-06-14 09:30:00', '2026-06-14 17:15:00');
