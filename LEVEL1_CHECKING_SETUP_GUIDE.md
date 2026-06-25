# Level 1 Checking System - Setup Guide

## Overview
The Level 1 Checking system allows supervisors to review and verify work completed by team members before it moves to higher levels of checking.

## Database Setup

### Step 1: Run the Migration
Execute the SQL commands in `LEVEL1_CHECKING_SETUP.sql` in your Supabase SQL editor:

```sql
-- Add check_status column to tasks table
ALTER TABLE tasks ADD COLUMN check_status VARCHAR(50) DEFAULT 'pending' CHECK (check_status IN ('pending', 'checking_level1', 'checking_level2', 'checking_level3', 'approved', 'rejected'));

-- Create task_checks table
CREATE TABLE task_checks (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  checker_id INTEGER NOT NULL REFERENCES employees(id),
  level INTEGER NOT NULL CHECK (level IN (1, 2, 3)),
  status VARCHAR(50) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'approved', 'rejected')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create subtask_verifications table
CREATE TABLE subtask_verifications (
  id SERIAL PRIMARY KEY,
  subtask_id INTEGER NOT NULL REFERENCES subtasks(id) ON DELETE CASCADE,
  task_check_id INTEGER NOT NULL REFERENCES task_checks(id) ON DELETE CASCADE,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_task_checks_task_id ON task_checks(task_id);
CREATE INDEX idx_task_checks_checker_id ON task_checks(checker_id);
CREATE INDEX idx_task_checks_level ON task_checks(level);
CREATE INDEX idx_subtask_verifications_subtask_id ON subtask_verifications(subtask_id);
CREATE INDEX idx_subtask_verifications_task_check_id ON subtask_verifications(task_check_id);
```

## How to Use

### 1. Create a Level 1 Check
When a task is ready for checking, create a task_check record:

```sql
INSERT INTO task_checks (task_id, checker_id, level, status)
VALUES (123, 2, 1, 'in_progress');

UPDATE tasks SET check_status = 'checking_level1' WHERE id = 123;
```

### 2. Access the Level 1 Checking Page
- Navigate to `/check/level1` in your browser (requires login)
- You'll see a list of all pending Level 1 checks
- Click on any check to open the detailed review form

### 3. Review Process

**Step 1: View Work Completed**
- The work review section shows all subtasks with their completion status
- This is read-only to maintain audit trail

**Step 2: Verification Checklist**
- Check off each subtask as you verify it
- Progress bar shows how many subtasks you've verified
- Each verification is timestamped

**Step 3: Add Notes**
- Document what you checked
- Note any issues or quality concerns
- Add your quality assessment

**Step 4: Take Action**
Choose one of three actions:

#### ✓ Approve & Send to Level 2
- Marks check as approved
- Creates a new task_check record for Level 2
- Updates task status to "checking_level2"
- All verified subtasks are recorded

#### ✗ Reject
- Marks check as rejected
- Task goes back to original worker
- Worker receives "Rework needed" notification
- Task status returns to "pending"

#### ↻ Reassign
- Reassign to another team member for same-level review
- Original check record is preserved (audit trail)
- New checker gets a fresh task_check record

### 4. Dashboard Integration
- Dashboard shows up to 3 pending checks as cards
- Click "View all" to go to the full checking page
- Badge shows total count of pending checks

## Data Flow

```
Task Created (status: 'pending')
    ↓
Task Ready for Review → Create task_check (level=1, status='in_progress')
    ↓
Level 1 Checker Reviews
    ├→ Approve → Create task_check (level=2) → Updates status to 'checking_level2'
    ├→ Reject → Updates status back to 'pending' → Worker reworks
    └→ Reassign → Create new task_check (level=1) for different checker
```

## API Endpoints

### Get Pending Level 1 Checks
```
GET /api/checks/level1
Returns: Array of pending level 1 task checks
```

### Get Check Details
```
GET /api/checks/level1/[checkId]
Returns: Full check details with verifications and task info
```

### Update Check (Approve/Reject/Reassign/Verify)
```
PUT /api/checks/level1/[checkId]
Body: {
  "action": "approve" | "reject" | "reassign" | "verify_subtask",
  "notes": "...",  // for approve/reject
  "new_checker_id": 123,  // for reassign
  "subtask_id": 456  // for verify_subtask
}
```

## Files Created

- `/app/check/level1/page.tsx` - Main checking page component
- `/app/api/checks/level1/route.ts` - API to fetch pending checks
- `/app/api/checks/level1/[id]/route.ts` - API for check operations
- Modified: `/app/dashboard/page.tsx` - Added pending checks section

## Testing the Feature

1. **Create test task:**
   - Go to Tasks page, create a new task
   - Fill in details and save

2. **Create test check:**
   - In Supabase SQL editor, run:
     ```sql
     INSERT INTO task_checks (task_id, checker_id, level, status) VALUES (1, 1, 1, 'in_progress');
     UPDATE tasks SET check_status = 'checking_level1' WHERE id = 1;
     ```

3. **Visit checking page:**
   - Go to `/check/level1`
   - See the pending check
   - Click to open detailed form

4. **Verify subtasks:**
   - Check off subtasks in verification checklist
   - Add notes
   - Click "Approve & Send to Level 2"
   - Verify task was moved to Level 2

## Notes

- All actions are logged with timestamps
- Checker identity is recorded for audit trail
- Original worker information preserved
- No data is deleted on reassign (full history maintained)
- Verification records link subtask to specific check

## Future Enhancements

- Level 2 and Level 3 checking pages (same structure)
- Email/WhatsApp notifications for reassignments
- Dashboard statistics on check turnaround time
- Checker performance metrics
