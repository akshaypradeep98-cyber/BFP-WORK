-- Create appointments table
CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id),
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  manager_id INTEGER NOT NULL REFERENCES employees(id),
  check_type VARCHAR(50) NOT NULL CHECK (check_type IN ('level1_check', 'level2_approval')),
  status VARCHAR(50) NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'confirmed', 'completed', 'cancelled')),
  appointment_date DATE,
  appointment_time TIME,
  queue_position INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_appointments_employee_id ON appointments(employee_id);
CREATE INDEX idx_appointments_manager_id ON appointments(manager_id);
CREATE INDEX idx_appointments_task_id ON appointments(task_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_created_at ON appointments(created_at);

-- Sample data (optional - for testing)
-- INSERT INTO appointments (task_id, employee_id, manager_id, check_type, status)
-- VALUES (1, 2, 3, 'level1_check', 'requested');
