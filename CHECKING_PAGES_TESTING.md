# Level 1 & Level 2 Checking Pages - Testing Guide

## Quick Start

### Step 1: Verify Database Tables Exist

Run this in Supabase SQL editor:

```sql
-- These tables should already exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('task_checks', 'subtask_verifications');
```

If missing, run:

```sql
CREATE TABLE task_checks (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id),
  checker_id INTEGER NOT NULL REFERENCES employees(id),
  check_level INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'in_progress',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE subtask_verifications (
  id SERIAL PRIMARY KEY,
  subtask_id INTEGER NOT NULL REFERENCES subtasks(id),
  task_check_id INTEGER NOT NULL REFERENCES task_checks(id),
  verified BOOLEAN DEFAULT true,
  verified_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE tasks ADD COLUMN check_status VARCHAR(50) DEFAULT 'pending';
```

### Step 2: Create Test Data

**In Supabase SQL editor:**

```sql
-- Check you have tasks
SELECT id, title, client_id, employee_id FROM tasks LIMIT 3;

-- Let's say you have task_id=1 and employee_id=2
-- Create a Level 1 check for task 1
INSERT INTO task_checks (task_id, checker_id, check_level, status)
VALUES (1, 3, 1, 'in_progress');

-- Note the ID returned (let's say it's 10)

-- Update task status
UPDATE tasks SET check_status = 'checking_level1' WHERE id = 1;

-- Verify it was created
SELECT id, task_id, checker_id, check_level, status 
FROM task_checks WHERE task_id = 1;
```

### Step 3: Test Level 1 Checking

1. Go to `http://localhost:3000/check/level1` (hard refresh with Ctrl+Shift+R)
2. You should see "Pending Checks (1)"
3. Click the task card to load it
4. You'll see:
   - Task header with client, period, amount, worker
   - Progress bar showing "0/X verified"
   - Subtasks with checkboxes (unchecked)
   - Notes textarea
   - Action buttons
5. Click subtask checkboxes to verify them
6. Progress bar updates in real-time
7. Add notes and click "Save Notes"
8. When all subtasks verified, click "Approve & Send to Level 2"
9. Alert appears: "Check approved! Task moved to Level 2"

### Step 4: Test Level 2 Approval

1. Go to `http://localhost:3000/check/level2` (hard refresh)
2. You should see "Pending (1)"
3. Click the task card
4. You'll see:
   - Task header
   - Level 1 Check Summary showing:
     - Who checked it
     - Their notes (if any)
     - How many verified
   - Approval checkbox (unchecked)
   - Optional notes field
5. Check the confirmation checkbox
6. "Approve & Complete" button becomes enabled
7. Click it
8. Alert: "Task approved and completed!"
9. Task status changes to 'approved' and check_status = 'approved'

### Step 5: Test Actions

**Reassign (both pages):**
1. Click "↻ Reassign" button
2. Dropdown shows other team members
3. Click a name
4. New task_check record created with new checker_id
5. Alert: "Check reassigned!"

**Reject (both pages):**
1. Click "✗ Reject" button
2. Confirm dialog
3. Check status = 'rejected'
4. Task check_status = 'pending'
5. Alert: "Check rejected. Task sent back to worker"

### Step 6: Test Dashboard

1. Go to `http://localhost:3000/dashboard`
2. If Level 1 checks exist, you'll see:
   - "📋 Level 1 Pending Checks (X)" section
   - Cards showing task name, client, worker
   - "View all →" link
3. If Level 2 approvals exist, you'll see:
   - "✓ Level 2 Pending Approvals (X)" section
   - Cards showing task name, client, L1 checker
   - "View all →" link
4. Click any card to go to the checking page

## Pages Created

| Page | URL | Purpose |
|------|-----|---------|
| Level 1 Checking | `/check/level1` | Verify subtasks, approve to Level 2 |
| Level 2 Approval | `/check/level2` | Final approval, mark task complete |

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/checks/level1` | GET | List pending Level 1 checks |
| `/api/checks/level1/[id]` | GET | Get check details |
| `/api/checks/level1/[id]` | PUT | Approve/Reject/Reassign/Save notes |
| `/api/checks/level2` | GET | List pending Level 2 approvals |
| `/api/checks/level2/[id]` | GET | Get approval details |
| `/api/checks/level2/[id]` | PUT | Approve/Reject/Reassign |
| `/api/subtask-verifications` | POST | Create/update subtask verification |
| `/api/subtask-verifications` | GET | Get verifications for a check |

## Data Flow

```
Task Created
  ↓
Create Level 1 Check (check_level=1, status=in_progress)
  ↓
Checker verifies subtasks → POST /api/subtask-verifications
  ↓
Checker approves
  ↓
Update check: status=approved
Create Level 2 Check (check_level=2, status=in_progress)
Update task: check_status=checking_level2
  ↓
Approver reviews L1 notes
  ↓
Approver confirms and approves
  ↓
Update check: status=approved
Update task: check_status=approved, status=done
  ↓
✓ Task Complete
```

## Troubleshooting

### Pending checks not showing
- Hard refresh browser (Ctrl+Shift+R)
- Verify task_checks table has records: `SELECT COUNT(*) FROM task_checks WHERE check_level=1 AND status='in_progress'`
- Check browser console (F12) for API errors

### Can't verify subtasks
- Verify subtask_verifications table exists
- Check console for POST errors to `/api/subtask-verifications`
- Verify task_check_id is correct

### Level 2 not showing after Level 1 approval
- Check task_checks table for new record with check_level=2
- Verify task check_status changed to 'checking_level2'

### Dashboard not showing pending checks
- Hard refresh
- Verify fetch calls succeed (check Network tab in DevTools)
- Check that pendingChecks and pendingLevel2 states have data

## What Each Page Shows

### Level 1 Checking

**Sidebar (Left)**
- List of pending Level 1 checks
- Click to select and load into form

**Main Form (Right)**
- Task header with period, amount, worker
- Progress bar: "X of Y verified"
- Subtask verification checklist (interactive)
  - Checkboxes are enabled
  - When ticked, creates subtask_verifications record
  - Shows "✓ Verified" badge
- Notes textarea with "Save Notes" button
- Three action buttons:
  - ✓ Green: Approve (only enabled when all subtasks verified)
  - ✗ Red: Reject (always enabled)
  - ↻ Amber: Reassign to another checker

### Level 2 Approval

**Sidebar (Left)**
- List of pending Level 2 approvals
- Click to select and load

**Main Form (Right)**
- Task header with period, amount
- Level 1 Check Summary (read-only):
  - Who checked it
  - Their notes
  - How many subtasks verified
- Approval confirmation section:
  - Checkbox: "I have reviewed the Level 1 check..."
  - Optional notes textarea
- Three action buttons:
  - ✓ Green: Approve (only enabled when checkbox checked)
  - ✗ Red: Reject
  - ↻ Amber: Reassign to another approver

## Files Created/Modified

Created:
- `/app/check/level1/page.tsx` - Level 1 checking interface
- `/app/check/level2/page.tsx` - Level 2 approval interface
- `/app/api/checks/level1/route.ts` - L1 list API
- `/app/api/checks/level1/[id]/route.ts` - L1 detail/update API
- `/app/api/checks/level2/route.ts` - L2 list API
- `/app/api/checks/level2/[id]/route.ts` - L2 detail/update API
- `/app/api/subtask-verifications/route.ts` - Verification API

Modified:
- `/app/dashboard/page.tsx` - Added pending checks sections

## Next Steps

- ✅ Pages work on localhost:3000
- ✅ All CRUD operations save to Supabase
- ✅ Real-time progress updates
- ✅ Dashboard integration
- 🔄 Could add: Email notifications, SLA tracking, performance metrics
