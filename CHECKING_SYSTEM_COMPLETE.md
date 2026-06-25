# Complete Checking System Implementation

## Database Schema Required

```sql
-- This should already exist, but verify:
ALTER TABLE tasks ADD COLUMN check_status VARCHAR(50) DEFAULT 'pending';

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
```

## Test Data Setup

```sql
-- Create test data
-- 1. Verify you have a task
SELECT * FROM tasks LIMIT 1;
-- Remember the task_id (let's say it's 1)

-- 2. Create a Level 1 check
INSERT INTO task_checks (task_id, checker_id, check_level, status)
VALUES (1, 2, 1, 'in_progress')
RETURNING id;
-- Remember the check_id returned

-- 3. Update task status
UPDATE tasks SET check_status = 'checking_level1' WHERE id = 1;

-- 4. Now go to http://localhost:3000/check/level1
```

## Features

### Level 1 Check Page (`/check/level1`)
- Lists pending checks for current user (checker_id = logged-in user)
- Shows: Task, Client, Period, Amount, Worker
- Click to open detailed checking form
- Reuses subtask display from task detail page
- Checker can tick subtasks to verify
- Each tick creates subtask_verifications record
- Shows progress: "X of Y verified"
- Add notes and approve/reject/reassign

### Level 2 Approval Page (`/check/level2`)
- Lists pending approvals for Manager/Senior
- Shows Level 1 checker's work
- Checkbox confirmation required before approval
- One-click approval when confirmed
- Can reject or reassign

### Dashboard Integration
- Shows pending checks for current user
- Shows pending approvals for Manager/Senior roles
- Quick cards to jump to checking page

## API Endpoints

All endpoints use simple, reliable queries:

```
GET  /api/checks/level1              - List pending L1 checks
GET  /api/checks/level1/[id]         - Get L1 check details
PUT  /api/checks/level1/[id]         - Approve/Reject/Reassign
POST /api/subtask-verifications      - Create verification

GET  /api/checks/level2              - List pending L2 approvals
GET  /api/checks/level2/[id]         - Get L2 details
PUT  /api/checks/level2/[id]         - Approve/Reject/Reassign
```

## Files to Create/Update

- `/app/check/level1/page.tsx` - Level 1 checking interface
- `/app/check/level2/page.tsx` - Level 2 approval interface
- `/app/api/checks/level1/route.ts` - L1 list API
- `/app/api/checks/level1/[id]/route.ts` - L1 detail/update API
- `/app/api/checks/level2/route.ts` - L2 list API
- `/app/api/checks/level2/[id]/route.ts` - L2 detail/update API
- `/app/api/subtask-verifications/route.ts` - Verification API
- `/app/dashboard/page.tsx` - Updated with checking sections

## Known Issues & Fixes

✅ Complex nested Supabase queries were failing → Use simple sequential queries
✅ Verification flow needed to save immediately → POST to API on each tick
✅ Progress tracking → Count verified subtasks in real-time
✅ Data reuse → Import subtask display component from task detail page
