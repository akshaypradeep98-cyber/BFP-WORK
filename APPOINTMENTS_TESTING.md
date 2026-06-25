# Appointment Request Workflow - Testing Guide

## Overview

Employees can request appointments with managers for task checks. The system tracks queue positions and allows managers to confirm appointment times.

## Workflow

```
Employee requests appointment
    ↓
Appointment created with status='requested'
    ↓
Manager reviews and accepts
    ↓
Status changes to 'accepted'
    ↓
Employee (or Manager) sets date/time
    ↓
Status changes to 'confirmed'
    ↓
Appointment scheduled
```

## Database Setup

Run this SQL in Supabase to create the appointments table:

```sql
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

CREATE INDEX idx_appointments_employee_id ON appointments(employee_id);
CREATE INDEX idx_appointments_manager_id ON appointments(manager_id);
CREATE INDEX idx_appointments_task_id ON appointments(task_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_created_at ON appointments(created_at);
```

## Testing Steps

### Step 1: Create Test Data

First, ensure you have:
- At least 2 employees
- At least 1 manager with classification = "Manager", "Senior", or "Partner"
- At least 1 task with check_status = 'waiting_for_checker'

In Supabase SQL editor:

```sql
-- Check existing data
SELECT id, name, classification FROM employees LIMIT 5;
SELECT id, title, employee_id, check_status FROM tasks WHERE check_status IN ('waiting_for_checker', 'checking_level1') LIMIT 5;
```

### Step 2: Access the Page

1. Log in as an employee (not a manager)
2. Go to `http://localhost:3000/appointments` (hard refresh with Ctrl+Shift+R)
3. You should see "Request an Appointment" section

### Step 3: Request an Appointment

1. **Select Check Type:**
   - Choose "Level 1 Check" or "Level 2 Approval"

2. **Select Task:**
   - Dropdown should show tasks with check_status = 'waiting_for_checker' or 'checking_level1'
   - Select one task

3. **Select Manager:**
   - Dropdown shows managers (classification = Manager/Senior/Partner)
   - Select a manager
   - ✅ You should see: "Queue: X people ahead of you"

4. **Click "Request Appointment":**
   - ✅ You should see: "✓ Request sent to [Manager name]. You have X people ahead of you."
   - Form should clear

5. **Check Your Pending Appointments:**
   - Table appears below with your new appointment
   - Status: "Requested"
   - Queue position shows
   - Action: None (waiting for manager to accept)

### Step 4: Verify in Database

```sql
-- See your appointment
SELECT * FROM appointments 
WHERE employee_id = [your_employee_id]
ORDER BY created_at DESC
LIMIT 1;

-- Should see:
-- - status = 'requested'
-- - check_type = 'level1_check' or 'level2_approval'
-- - appointment_date = NULL
-- - appointment_time = NULL
```

### Step 5: Accept Appointment (Manager View)

This would be done by the manager, but for testing you can manually update:

```sql
UPDATE appointments 
SET status = 'accepted', updated_at = NOW()
WHERE employee_id = [employee_id] AND status = 'requested'
LIMIT 1;
```

Then refresh the page: ✅ Status should change to "Accepted" and "Set time" button appears

### Step 6: Set Appointment Time

1. Refresh page to see updated status
2. ✅ You should see a "Set time" button in the Action column
3. Click "Set time"
4. ✅ Date and time pickers appear
5. Select a date and time
6. Click "Set time"
7. ✅ Status changes to "Confirmed"
8. ✅ Date/time displays in the "When" column
9. ✅ Button changes to "Coming up" badge

### Step 7: Test Queue Position

Make multiple appointment requests from the same employee:

1. Request appointment with Manager A (1st request)
   - Queue position: 1
2. Request appointment with Manager A (2nd request)
   - Queue position: 2
3. Request appointment with Manager A (3rd request)
   - Queue position: 3

✅ Each subsequent request shows correct queue position

## UI Elements

### Request Form

```
Request an Appointment

I need a ◉ Level 1 Check ○ Level 2 Approval

For my task:
[Dropdown: Select a task...]

Request from manager:
[Dropdown: Select a manager...]
Queue: 3 people ahead of you

[Request Appointment Button]
```

### Appointments Table

| Task | Manager | Type | Status | Queue | When | Action |
|------|---------|------|--------|-------|------|--------|
| GST Return | John Doe | L1 Check | Requested | Position 2 | — | — |
| Income Tax | Jane Smith | L2 Approval | Accepted | Position 1 | — | [Set time] |
| Audit | Bob Jones | L1 Check | Confirmed | Position 3 | 2026-07-15 10:30 | Coming up |

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/appointments` | GET | Get user's appointments |
| `/api/appointments` | POST | Create appointment |
| `/api/appointments/[id]` | PUT | Update appointment (set time) |
| `/api/appointments/tasks` | GET | Get user's tasks waiting for checks |
| `/api/appointments/managers` | GET | Get available managers |

## Test Cases

### Happy Path
- [ ] Employee requests appointment
- [ ] Appointment appears in "Your pending appointments"
- [ ] Status is "Requested"
- [ ] Queue position is correct
- [ ] Manager accepts (manual DB update)
- [ ] Employee sets time
- [ ] Status changes to "Confirmed"
- [ ] Appointment date/time displays

### Edge Cases
- [ ] No tasks available → dropdown empty, form disabled
- [ ] No managers available → dropdown empty, form disabled
- [ ] Same manager multiple requests → queue position increments
- [ ] Different managers → separate queues

### Database Checks
- [ ] appointments table created
- [ ] New appointment has correct task_id, employee_id, manager_id
- [ ] check_type is 'level1_check' or 'level2_approval'
- [ ] Status progression: requested → accepted → confirmed
- [ ] Queue positions calculated correctly

## Notes

- Employees only see their own appointments (not others')
- Queue position = count of appointments for that manager created before this one (excluding completed/cancelled)
- When setting time, either employee or manager can do it first (not implemented: first wins logic)
- Tests assume you have at least 1 task with check_status = 'waiting_for_checker'
- If no tasks available, you need to create one in the Tasks page first
