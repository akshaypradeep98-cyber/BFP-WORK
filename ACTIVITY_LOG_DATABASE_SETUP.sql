-- Create activity_log table for audit trail
CREATE TABLE IF NOT EXISTS activity_log (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  detail TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index on timestamp for efficient sorting
CREATE INDEX IF NOT EXISTS idx_activity_log_timestamp ON activity_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_employee_id ON activity_log(employee_id);

-- Insert test activity log records
INSERT INTO activity_log (employee_id, action, detail, timestamp) VALUES
  (1, 'Task created', 'GST Return - June assigned to Sneha Iyer', '2026-06-17 10:30:00'),
  (2, 'Payment recorded', '₹5,000 for GST Return - June', '2026-06-17 10:45:00'),
  (1, 'Leave approved', 'Sneha Iyer: 18 Jun 2026 - 20 Jun 2026', '2026-06-17 11:00:00'),
  (3, 'Employee added', 'Rajesh Kumar', '2026-06-16 09:15:00'),
  (2, 'Client added', 'Tech Innovations Pvt Ltd', '2026-06-16 14:20:00'),
  (1, 'Task reassigned', 'ITR Filing: reassigned from Rajesh Kumar to Sneha Iyer', '2026-06-15 16:30:00'),
  (3, 'Payment removed', '₹2,500 from Audit Report - May', '2026-06-15 17:00:00'),
  (2, 'Leave requested', 'Rajesh Kumar: 22 Jun 2026 - 24 Jun 2026', '2026-06-14 13:45:00'),
  (1, 'Certificate added', 'Ravi Menon (Partner)', '2026-06-14 15:20:00'),
  (3, 'Employee updated', 'Sneha Iyer', '2026-06-13 10:00:00');
