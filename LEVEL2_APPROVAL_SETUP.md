# Level 2 Approval System - Setup Guide

## Overview
The Level 2 Approval system allows managers/seniors to review Level 1 checker's work and give final approval before task completion.

## How It Works

### Data Flow
```
Level 1 Check Approved
    ↓
task_checks with check_level=2 created (status: in_progress)
    ↓
Level 2 Approver Reviews
    ├→ Approve → task_check (level=2, status=approved) → task status='approved', check_status='approved'
    ├→ Reject → task_check (status=rejected) → task status=pending
    └→ Reassign → new task_check (level=2) for different approver
```

## Testing Level 2

### Step 1: Create a Level 1 Check (if not done)
```sql
-- Create a pending Level 1 check
INSERT INTO task_checks (task_id, checker_id, check_level, status)
VALUES (1, 2, 1, 'in_progress');

UPDATE tasks SET check_status = 'checking_level1' WHERE id = 1;
```

### Step 2: Approve the Level 1 Check
```sql
-- Simulate Level 1 checker approving
UPDATE task_checks 
SET status = 'approved', approved_at = NOW()
WHERE task_id = 1 AND check_level = 1;

-- This will trigger Level 2 creation (in real flow)
-- For testing, manually create Level 2:
INSERT INTO task_checks (task_id, checker_id, check_level, status)
VALUES (1, 3, 2, 'in_progress');

UPDATE tasks SET check_status = 'checking_level2' WHERE id = 1;
```

### Step 3: Visit the Level 2 Page
- Go to `http://localhost:3000/check/level2`
- You should see the pending approval
- Click to open the approval form

### Step 4: Test Approval Actions

**To Approve:**
1. Check the "I have reviewed..." checkbox
2. Optionally add notes
3. Click "✓ Approve & Complete Task"
4. Task moves to status='approved' and check_status='approved'

**To Reject:**
1. Click "✗ Reject" button
2. Task goes back to pending

**To Reassign:**
1. Click "↻ Reassign"
2. Select another approver
3. New task_check record created for Level 2

## Interface Features

### Pending Approvals List
- Shows all tasks awaiting Level 2 approval
- Displays: Task name, Client, L1 Checker, Date checked
- Click to open approval form

### Approval Form

**Level 1 Check Summary Section**
- Shows who did Level 1 check and when
- Lists all subtasks with verification status (✓ or ○)
- Displays L1 Checker's notes

**Your Approval Section**
- Mandatory checkbox: "I have reviewed the Level 1 check and approve this task"
- Checkbox must be ticked before approval is allowed
- Optional notes for approval record

**Action Buttons**
- **✓ Approve & Complete Task** (green) - Only enabled when checkbox is checked
- **✗ Reject** (red) - Sends task back to worker
- **↻ Reassign** (amber) - Reassign to another approver

## Files Created

- `/app/check/level2/page.tsx` - Level 2 approval interface (350+ lines)
- `/app/api/checks/level2/route.ts` - API to fetch pending approvals
- `/app/api/checks/level2/[id]/route.ts` - API for approval operations
- Modified: `/app/dashboard/page.tsx` - Added Level 2 section

## Dashboard Integration

The dashboard now shows:
- **"Level 2 Pending Approvals"** section with count badge
- First 3 pending approvals displayed as cards
- Purple border to distinguish from Level 1 (amber)
- Click "View all →" for full Level 2 page

## API Endpoints

### Get Pending Level 2 Approvals
```
GET /api/checks/level2
Returns: Array of tasks pending Level 2 approval
```

### Get Approval Details with Level 1 Info
```
GET /api/checks/level2/[id]
Returns: 
  - Full task details
  - Level 2 check info
  - Level 1 check details (notes, checker info)
  - Level 1 verification records
```

### Approve/Reject/Reassign
```
PUT /api/checks/level2/[id]
Body: {
  "action": "approve" | "reject" | "reassign",
  "notes": "...",  // optional for approve/reject
  "new_checker_id": 123  // for reassign
}
```

## Notes

- Level 2 approver sees Level 1 checker's notes (read-only)
- Sees which subtasks were verified by Level 1 (with checkmarks)
- Must confirm review before approval is allowed
- All actions logged with timestamps
- Reassign preserves audit trail (old check record kept)

## Visual Distinctions

| Level | Color | Badge |
|-------|-------|-------|
| Level 1 Check | Amber (📋) | "Level 1 check in progress" |
| Level 2 Approval | Purple (✓) | "Level 2 approval" |
| Completed | Green (✓) | Task marked as "approved" |

## Next Steps

Future enhancements:
- Level 3 checking for sensitive tasks
- Email notifications when tasks move between levels
- Manager dashboard showing approval metrics
- SLA tracking for approval turnaround time
