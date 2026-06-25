# Full Workflow Integration Guide - End-to-End Testing

## Complete User Journey

This document shows how all components work together from task creation to completion.

## 1. Employee Creates Task (Existing)

**Page:** `/tasks` → Create New Task
**Status:** `todo` (initially)

```
Employee fills:
- Task title
- Subtasks
- Hours
- Client
- Tax period
```

## 2. Employee Works on Task

**Page:** `/tasks/[id]`
**Status:** `in_progress`

Employee clicks "In Progress" from status dropdown.

## 3. Employee Marks Task as Done & Assigns Checker

**Page:** `/tasks/[id]`
**Action:** Click "Done" from status dropdown

Modal appears with two options:

### Option A: Assign Checker Now
```
✓ Assign a checker now
  [Dropdown to select checker]
  [Approve] - Creates task_check record immediately
```

- Status → `checking_level1`
- Creates `task_checks` record with status='in_progress'
- Checker can now see task at `/check/level1`

### Option B: Assign Later
```
○ I'll assign later
  [Skip] - Sets status to 'waiting_for_checker'
```

- Status → `waiting_for_checker`
- Red warning banner appears in task detail
- Checker can be assigned later via dropdown on banner
- Employee can also request appointment while waiting

## 4. Employee Can Request Appointment (Optional Path)

**Page:** `/appointments`
**Prerequisite:** Task has status = 'waiting_for_checker' or 'checking_level1'

```
Form:
  Check Type: ○ Level 1 Check ◉ Level 2 Approval
  Task: [Dropdown - shows tasks waiting for checks]
  Manager: [Dropdown - shows managers with queue position]
  
  [Request Appointment Button]
```

**Result:**
- Creates `appointments` record with status='requested'
- Shows queue position
- Appears in "Your pending appointments" table

## 5. Manager Reviews Appointment Request

**Page:** `/manager/appointments`
**Prerequisites:** 
- User must have classification = 'Manager', 'Senior', or 'Partner'
- Shows only their appointments

### Section 1: Appointment Requests (status='requested')
```
Table shows:
- Employee name
- Task title
- Check type (L1/L2)
- Submitted time (relative: "2m ago")
- Queue position (#1, #2, etc)
- Action buttons: [Accept] [Decline]
```

**Manager Action - Accept:**
- Status → `accepted`
- Appointment moves to "Waiting for Time" section

**Manager Action - Decline:**
- Status → `declined`
- Appointment removed from all sections

## 6. Manager Sets Appointment Time

**Page:** `/manager/appointments`
**From:** "Accepted - Waiting for Time" section
**Status:** `accepted`

```
Each row has:
- [Set time] button

Clicking opens:
  [Date picker] [Time picker] [Save]

After selecting:
  - Status → `confirmed`
  - Moves to "Confirmed & Upcoming" section
  - Sorted by scheduled date/time
```

## 7. Checker Reviews Task (Level 1 Check)

**Page:** `/check/level1`
**Prerequisite:** Task status = 'checking_level1'

```
Sidebar: Shows pending checks
Main area:
  - Worker's task (read-only)
  - Subtasks list with checkboxes
  - Notes textarea for checker assessment
  - Progress bar
  - [Approve] [Reject] [Reassign] buttons
```

**Checker Actions:**
1. **Verify Subtasks:** Check boxes as verified
2. **Add Notes:** Optional assessment notes
3. **Approve:** Task → Level 2 approval
4. **Reject:** Task → 'rejected', back to employee
5. **Reassign:** Task → 'checking_level1' with new checker_id

## 8. Manager Approves Task (Level 2 Approval)

**Page:** `/check/level2`
**Prerequisite:** Task status = 'Level 2 approval pending'

```
Sidebar: Shows pending approvals
Main area:
  - Level 1 checker's notes (read-only)
  - Verified subtasks (read-only)
  - Confirmation checkbox required
  - Optional notes
  - [Approve] [Reject] [Reassign] buttons
```

**Manager Actions:**
1. **Check Confirmation:** Must check box to enable approve
2. **Add Notes:** Optional approval notes
3. **Approve:** Task → `completed`
4. **Reject:** Task → 'rejected', back to employee
5. **Reassign:** Task → 'Level 2 approval pending' with new manager_id

## 9. Task Completion & Dashboard

**Page:** `/dashboard`

### For Employee:
```
My Tasks section:
- Shows completed tasks
- Shows pending checks (if reassigned by checker)
- Shows rejected tasks

Appointments section:
- Shows past appointments marked complete
```

### For Manager:
```
Pending Checks: (New)
- Shows tasks at 'checking_level1' assigned to this manager
- Quick links to go to /check/level1

Pending Approvals: (New)
- Shows tasks at 'Level 2 approval' assigned to this manager
- Quick links to go to /check/level2

Appointment Queue: (Badge)
- Shows count of pending appointment requests
- Link to /manager/appointments
```

## 10. Marking Appointment as Complete

**Page:** `/manager/appointments`
**From:** "Confirmed & Upcoming" section
**Status:** `confirmed`

```
Each row shows:
- Full scheduled date/time
- [Confirm checked] button

Clicking updates:
  - Status → `completed`
  - Removed from "Confirmed & Upcoming"
  - (In future: could trigger task completion verification)
```

## Data Flow Diagram

```
Employee Task Created
        ↓
Employee Works → Status: 'in_progress'
        ↓
Mark as Done
        ├─→ Assign Now ──→ Status: 'checking_level1' + task_checks
        │                 ↓
        │        Checker Reviews (Level 1)
        │                 ↓
        │        Status: 'Level 2 approval pending'
        │                 ↓
        │        Manager Approves (Level 2)
        │                 ↓
        │        Status: 'completed'
        │
        └─→ Assign Later ──→ Status: 'waiting_for_checker'
                              ↓
                      (Optional: Request Appointment)
                              ↓
                      Manager accepts appointment
                              ↓
                      Status: 'checking_level1'
                              ↓
                              [continues as above]
```

## Integration Points to Verify

### 1. Task Status Progression
```sql
SELECT id, title, status, check_status 
FROM tasks 
WHERE employee_id = [emp_id]
ORDER BY updated_at DESC;
```

Should show progression:
- `todo` → `in_progress` → `checking_level1` → `Level 2 approval pending` → `completed`

### 2. Task Checks Tracking
```sql
SELECT id, task_id, checker_id, approver_id, status 
FROM task_checks 
WHERE task_id = [task_id]
ORDER BY created_at;
```

Should show:
- One `task_checks` record created when checker assigned
- Status: `in_progress` → `approved` or `rejected`

### 3. Appointments Integration
```sql
SELECT id, task_id, employee_id, manager_id, status, created_at 
FROM appointments 
WHERE employee_id = [emp_id]
ORDER BY created_at DESC;
```

Should show status progression:
- `requested` → `accepted` → `confirmed` → `completed`

### 4. Role-Based Access
- Non-managers cannot access `/manager/appointments` (redirects to `/dashboard`)
- Non-checkers cannot see tasks at `/check/level1` unless assigned
- Employees only see their own tasks and appointments

## End-to-End Test Scenarios

### Scenario 1: Quick Path (Assign Checker Immediately)
```
1. Employee creates task → Status: 'todo'
2. Employee marks in progress → Status: 'in_progress'
3. Employee marks done + assigns checker → Status: 'checking_level1'
4. Checker approves → Status: 'Level 2 approval pending'
5. Manager approves → Status: 'completed'
   
Expected: 5 steps, no appointments
```

### Scenario 2: Appointment Path (Assign Later)
```
1. Employee creates task → Status: 'todo'
2. Employee marks in progress → Status: 'in_progress'
3. Employee marks done → Status: 'waiting_for_checker'
4. Employee requests appointment → Appointment status: 'requested'
5. Manager accepts appointment → Appointment status: 'accepted'
6. Manager sets time → Appointment status: 'confirmed'
7. Manager marks complete → Appointment status: 'completed'
   [Task still 'waiting_for_checker']
8. Employee assigns checker from banner → Status: 'checking_level1'
9. Checker approves → Status: 'Level 2 approval pending'
10. Manager approves → Status: 'completed'
    
Expected: 10 steps with full appointment workflow
```

### Scenario 3: Rejection & Reassignment
```
1. Employee creates → todo
2. Marks done + assigns checker → checking_level1
3. Checker rejects → 'rejected'
4. [In future] Employee sees feedback on dashboard
5. Employee fixes and resubmits (reassign checker)
6. New checker approves → 'Level 2 approval pending'
7. Manager approves → 'completed'
```

## Performance Considerations

### Queue Position Calculation
- Calculated on client-side from appointment counts
- No database writes for queue position
- Query: Count non-completed/non-declined appointments before this one
- Performance: O(1) lookup, efficient for typical queue sizes

### Concurrent Requests
- If 2 employees request appointment simultaneously:
  - Both see queue position calculated from current DB state
  - Race condition: queue position might be off by 1 briefly
  - Resolves on next fetch (page refresh)
- Solution in future: Database-level queue management

### Dashboard Loading
- 3 separate API calls (pending checks, pending approvals, appointment count)
- Could be optimized with single combined endpoint
- Current: ~50-100ms per endpoint

## Future Enhancements

### Notifications (Not Implemented)
- [ ] Email when appointment accepted
- [ ] Email when appointment time set
- [ ] Dashboard notification for rejected tasks
- [ ] Real-time updates via WebSocket

### Task-Appointment Integration
- [ ] Automatic status update when appointment marked complete
- [ ] Show appointment history on task detail page
- [ ] Calendar view of upcoming appointments

### Queue Management
- [ ] Database-stored queue position for exact ordering
- [ ] Ability to deprioritize own request
- [ ] SLA tracking (how long in each queue)

### Reporting
- [ ] Average time from done → checking_level1
- [ ] Average approval time per checker/manager
- [ ] Queue analytics

## Testing Checklist

### Access Control
- [ ] Manager can access `/manager/appointments`
- [ ] Non-manager redirected to `/dashboard`
- [ ] Employee can access `/appointments`
- [ ] Checker can access `/check/level1`
- [ ] Approver can access `/check/level2`

### Status Progression
- [ ] Task status updates correctly through workflow
- [ ] Task checks status updates correctly
- [ ] Appointment status updates correctly
- [ ] Updated_at timestamp changes on each update

### Queue System
- [ ] Queue position increments for multiple requests
- [ ] Queue position updates after manager accepts/declines
- [ ] Different managers have separate queues

### UI Elements
- [ ] All buttons display correctly
- [ ] All dropdowns populate with correct data
- [ ] Status badges display with correct colors
- [ ] Relative times format correctly ("2m ago")

### Data Integrity
- [ ] No orphaned appointments (missing employee/manager)
- [ ] No orphaned task_checks (missing task)
- [ ] No status inconsistencies (confirmed without date/time)
- [ ] Foreign key constraints respected

## Quick Start Commands

### Create Test Data
```bash
# Log in as employee
# Go to /tasks
# Click "Create Task"
# Fill form and submit
# Task created with status='todo'

# Then go to /tasks/[id]
# Click status dropdown
# Select "In Progress"
```

### Run Full Workflow
See Scenario 2 above for step-by-step guide.

### Verify Database State
See "Integration Points to Verify" above for SQL queries.
