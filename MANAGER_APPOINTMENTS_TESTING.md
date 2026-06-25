# Manager Appointment Queue Dashboard - Testing Guide

## Overview

Manager-only dashboard to manage appointment requests from employees. Shows three sections:
1. **Appointment Requests** - Pending requests to accept/decline
2. **Accepted - Waiting for Time** - Requests accepted, waiting for time confirmation
3. **Confirmed & Upcoming** - Scheduled appointments

## Access Control

The page at `/manager/appointments` is accessible only to users with:
- classification = "Manager" OR "Senior" OR "Partner"

Non-managers are redirected to `/dashboard`.

## Database Schema

Appointments table already created. Additional statuses added:
- `declined` - Manager declined the request
- `completed` - Appointment was conducted

## Testing Steps

### Step 1: Setup Test Data

Create test appointments in Supabase:

```sql
-- Get a manager ID (should have classification='Manager', 'Senior', or 'Partner')
SELECT id, name, classification FROM employees WHERE classification IN ('Manager', 'Senior', 'Partner') LIMIT 1;

-- Get an employee ID (not manager)
SELECT id, name FROM employees WHERE classification NOT IN ('Manager', 'Senior', 'Partner') LIMIT 1;

-- Get task IDs
SELECT id, title FROM tasks LIMIT 3;

-- Create test appointments
INSERT INTO appointments (task_id, employee_id, manager_id, check_type, status, created_at)
VALUES 
  (1, 2, 3, 'level1_check', 'requested', NOW() - INTERVAL '2 hours'),
  (2, 2, 3, 'level1_check', 'requested', NOW() - INTERVAL '1 hour'),
  (3, 2, 3, 'level2_approval', 'accepted', NOW() - INTERVAL '30 minutes');

SELECT * FROM appointments WHERE manager_id = 3 ORDER BY created_at;
```

### Step 2: Access the Dashboard

1. Log in as a manager (classification = Manager/Senior/Partner)
2. Go to `http://localhost:3000/manager/appointments` (hard refresh)
3. ✅ You should see three sections with your appointments

### Step 3: Test "Appointment Requests" Section

**View**:
- ✅ Shows pending requests (status='requested')
- ✅ Shows employee name, task, type (L1/L2), submitted time, queue position
- ✅ Shows "X pending" badge at top

**Accept Button**:
1. Click "Accept" on a request
2. ✅ Shows success message: "✓ Appointment accepted"
3. ✅ Appointment moves to "Accepted - Waiting for Time" section
4. ✅ Status changes to 'accepted' in database

**Decline Button**:
1. Click "Decline" on a request
2. ✅ Shows success message: "✓ Request declined"
3. ✅ Appointment disappears from all sections
4. ✅ Status changes to 'declined' in database

### Step 4: Test "Accepted - Waiting for Time" Section

**View**:
- ✅ Shows accepted appointments (status='accepted')
- ✅ Shows employee name, task, "Waiting for scheduling" status
- ✅ Shows "Set time" button

**Set Time**:
1. Click "Set time"
2. ✅ Date and time pickers appear
3. ✅ Select a future date and time
4. ✅ Click "Save"
5. ✅ Shows success message: "✓ Appointment time confirmed"
6. ✅ Appointment moves to "Confirmed & Upcoming" section
7. ✅ Status changes to 'confirmed' in database
8. ✅ Scheduled datetime is stored

### Step 5: Test "Confirmed & Upcoming" Section

**View**:
- ✅ Shows confirmed appointments (status='confirmed')
- ✅ Sorted by scheduled date/time (upcoming first)
- ✅ Shows employee name, task, scheduled datetime, "Confirmed" status
- ✅ Shows "Confirm checked" button

**Confirm Checked**:
1. Click "Confirm checked" on a confirmed appointment
2. ✅ Shows success message: "✓ Appointment marked complete"
3. ✅ Appointment disappears from section
4. ✅ Status changes to 'completed' in database

### Step 6: Test Queue Positions

```sql
-- Create 5 appointments for same manager from different employees
INSERT INTO appointments (task_id, employee_id, manager_id, check_type, status, created_at)
VALUES 
  (1, 2, 3, 'level1_check', 'requested', NOW()),
  (2, 4, 3, 'level1_check', 'requested', NOW() + INTERVAL '1 second'),
  (3, 5, 3, 'level1_check', 'requested', NOW() + INTERVAL '2 seconds'),
  (1, 6, 3, 'level1_check', 'requested', NOW() + INTERVAL '3 seconds'),
  (2, 7, 3, 'level1_check', 'requested', NOW() + INTERVAL '4 seconds');
```

Refresh page - ✅ Queue positions should be: #1, #2, #3, #4, #5

### Step 7: Test Submitted Time Display

- "2m ago" - submitted 2 minutes ago
- "15m ago" - submitted 15 minutes ago
- "1h ago" - submitted 1 hour ago
- "2d ago" - submitted 2 days ago

## UI Elements

### Appointment Requests Section
```
Appointment Requests [5 pending]

| Employee | Task | Type | Submitted | Queue | Action |
|----------|------|------|-----------|-------|--------|
| John Doe | GST Return | L1 Check | 2m ago | #1 | [Accept] [Decline] |
| Jane Smith | Income Tax | L1 Check | 15m ago | #2 | [Accept] [Decline] |
```

### Accepted - Waiting for Time Section
```
Accepted - Waiting for Time Confirmation

| Employee | Task | Status | Action |
|----------|------|--------|--------|
| Bob Jones | Audit | Waiting for scheduling | [Set time] |
```

Or with time picker open:
```
| Bob Jones | Audit | Waiting for scheduling | [date] [time] [Save] |
```

### Confirmed & Upcoming Section
```
Confirmed & Upcoming (3)

| Employee | Task | Scheduled | Status | Action |
|----------|------|-----------|--------|--------|
| Alice Brown | GST Return | 2026-07-15 14:30 | Confirmed | [Confirm checked] |
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/manager/appointments` | GET | Get manager's appointments |
| `/api/appointments/[id]` | PUT | Accept/Decline/Set time/Complete |

## Database Checks

```sql
-- Verify appointment status progression
SELECT id, employee_id, manager_id, status, appointment_date, appointment_time, created_at
FROM appointments
WHERE manager_id = [manager_id]
ORDER BY created_at;

-- Verify queue positions (count pending before each)
SELECT id, employee_id, created_at,
  (SELECT COUNT(*) FROM appointments a2 
   WHERE a2.manager_id = a1.manager_id 
   AND a2.status IN ('requested', 'accepted', 'confirmed')
   AND a2.created_at < a1.created_at) + 1 as queue_position
FROM appointments a1
WHERE manager_id = [manager_id]
ORDER BY created_at;
```

## Test Cases

- [ ] Manager can view all three sections
- [ ] Accept request moves it to "Accepted" section
- [ ] Decline removes request from all sections
- [ ] Set time in "Accepted" section moves to "Confirmed"
- [ ] Confirm checked in "Confirmed" removes it
- [ ] Queue positions calculated correctly
- [ ] Submitted time formatted correctly (m ago, h ago, d ago)
- [ ] Non-managers are redirected to /dashboard
- [ ] Only shows own appointments (filtered by manager_id)

## Notifications (Not Implemented Yet)

In a full implementation, these would send notifications:
- Accept: Notify employee "[Manager] accepted your appointment request"
- Decline: Notify employee "Request declined, try another manager"
- Set time: Notify employee "Your appointment is confirmed for [date/time]"
- Complete: Notify employee "Thank you for the appointment"

For now, actions just update the database.
