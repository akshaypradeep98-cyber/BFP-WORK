# Task Checking Workflow - Testing Guide

## Overview

When marking a task as "Done", users now have two options:
1. **Assign a checker now** - Immediately create a Level 1 check and notify the checker
2. **I'll assign later** - Mark task done, assign checker later

## Feature Workflow

### Option 1: Assign Checker Now

```
User selects "Done" from status dropdown
    ↓
Modal appears with two radio options
    ↓
User selects "Assign a checker now"
    ↓
Dropdown appears to select checker
    ↓
User clicks "Continue"
    ↓
Backend:
  - Set status = 'done'
  - Set check_status = 'checking_level1'
  - Create task_check record (level=1, checker_id=[selected])
    ↓
UI shows: "✓ Task done. Checker assigned to [Name]"
```

### Option 2: Assign Later

```
User selects "Done" from status dropdown
    ↓
Modal appears with two radio options
    ↓
User selects "I'll assign later"
    ↓
User clicks "Continue"
    ↓
Backend:
  - Set status = 'done'
  - Set check_status = 'waiting_for_checker'
    ↓
UI shows: "✓ Task done. Assign a checker below."
    ↓
Red warning banner appears with dropdown
    ↓
User selects checker from dropdown
    ↓
check_status changes to 'checking_level1'
    ↓
Banner disappears
```

## Testing Steps

### Setup
1. Go to a task: `http://localhost:3000/tasks/1` (or any task)
2. Status should currently be "todo" or "in-progress"

### Test Option 1: Assign Now

1. Click the **Status** dropdown
2. Select **"Done"**
3. Modal appears with two options
4. Click radio button: **"Assign a checker now"**
5. Dropdown appears: "Who should check this?"
6. Select an employee (e.g., "John Doe")
7. Click **"Continue"**
8. ✅ You should see: "✓ Task done. Checker assigned to John Doe"
9. Task status changes to "done"
10. task_checks table should have new record with:
    - task_id = your task id
    - checker_id = selected employee id
    - check_level = 1
    - status = 'in_progress'

### Test Option 2: Assign Later

1. Reload the page: `http://localhost:3000/tasks/1`
2. Change status back to "In progress" first (for testing)
3. Click the **Status** dropdown
4. Select **"Done"**
5. Modal appears
6. Click radio button: **"I'll assign later"**
7. Click **"Continue"**
8. ✅ You should see: "✓ Task done. Assign a checker below."
9. **Red warning banner** appears below message with text:
   - "⚠️ No checker assigned"
   - "Assign a checker below to start the verification process"
10. Dropdown: "Choose a team member..."
11. Select any employee
12. ✅ Banner disappears
13. check_status changes to 'checking_level1'
14. task_checks table should have new record

### Verify Checker Assignment

**In Supabase SQL editor:**

```sql
-- Check that task_checks records were created
SELECT id, task_id, checker_id, check_level, status, created_at
FROM task_checks
WHERE task_id = [your_task_id]
ORDER BY created_at DESC;

-- Should see at least one record with:
-- - check_level = 1
-- - status = 'in_progress'
-- - checker_id = the employee you selected
```

## UI Elements

### Status Dropdown (Before Change)
```
[Dropdown: To do | In progress | Done]
```

### Modal (When "Done" Selected)
```
┌─────────────────────────────────┐
│ Mark Task as Done               │
│                                 │
│ Would you like to assign a      │
│ checker now, or do it later?    │
│                                 │
│ ◯ Assign a checker now          │
│   Choose who will check this    │
│   [Dropdown: Select a checker]  │
│                                 │
│ ◯ I'll assign later             │
│   Mark as done now, assign      │
│   checker later                 │
│                                 │
│ [Cancel]  [Continue]            │
└─────────────────────────────────┘
```

### Red Warning Banner (Assign Later)
```
┌──────────────────────────────────────────┐
│ ⚠️  No checker assigned                  │
│     Assign a checker below to start the  │
│     verification process                │
│                                          │
│ Select a checker:                        │
│ [Dropdown: Choose a team member...]      │
└──────────────────────────────────────────┘
```

### Success Message
```
✓ Task done. Checker assigned to John Doe
(Green banner, auto-disappears after 4 seconds)
```

## Data Changes

### Database State After "Assign Now"

**tasks table:**
```
id    status  check_status      updated_at
--    ------  ---------------   ----------
1     done    checking_level1   [now]
```

**task_checks table (new row):**
```
id    task_id  checker_id  check_level  status         created_at
--    -------  ----------  -----------  -------        ----------
10    1        2           1            in_progress    [now]
```

### Database State After "Assign Later" (Before Assigning Checker)

**tasks table:**
```
id    status  check_status          updated_at
--    ------  --------------------  ----------
1     done    waiting_for_checker   [now]
```

**task_checks table:**
```
(empty until checker is assigned)
```

### After Assigning Checker from Banner

**tasks table:**
```
id    status  check_status      updated_at
--    ------  ---------------   ----------
1     done    checking_level1   [now]
```

**task_checks table (new row):**
```
id    task_id  checker_id  check_level  status         created_at
--    -------  ----------  -----------  -------        ----------
11    1        3           1            in_progress    [now]
```

## Troubleshooting

### Modal doesn't appear when clicking "Done"
- Hard refresh browser (Ctrl+Shift+R)
- Check browser console (F12) for errors
- Verify task detail page is loading correctly

### Checker dropdown is empty
- Verify employees exist in database
- Check `/api/employees` endpoint
- Try refreshing the page

### Red banner not appearing for "waiting_for_checker"
- Hard refresh browser
- Verify check_status = 'waiting_for_checker' in database
- Check that task.status = 'done'

### Task check not created in database
- Check `/api/tasks/[id]` endpoint
- Verify task_checks table exists
- Check browser Network tab for POST errors

## Code Changes

### Files Modified
1. `/app/tasks/[id]/page.tsx`
   - Added checker assignment modal
   - Added red warning banner
   - Added handlers for both options
   - Added state management for modal

2. `/app/api/tasks/[id]/route.ts`
   - Added support for check_status parameter
   - Added support for checker_id parameter
   - Added logic to create task_check record

### New State Variables (in task detail page)
```typescript
const [showCheckerAssignment, setShowCheckerAssignment] = useState(false);
const [checkerAssignmentOption, setCheckerAssignmentOption] = useState<"now" | "later" | null>(null);
const [selectedChecker, setSelectedChecker] = useState<number | null>(null);
const [isAssigningChecker, setIsAssigningChecker] = useState(false);
const [checkerAssignmentMessage, setCheckerAssignmentMessage] = useState("");
```

### New Handlers
- `handleStatusChange()` - Modified to show modal for "done"
- `handleCompleteTaskWithChecker()` - Handles both assign now and assign later
- `handleAssignCheckerLater()` - Handles assigning checker from red banner

## Integration with Checking Pages

After a checker is assigned:
1. Checker sees pending check on `/check/level1`
2. Checker verifies subtasks
3. Checker approves to Level 2
4. Approver reviews on `/check/level2`
5. Approver completes the task

## Next Steps

- ✅ Modal for assignment options
- ✅ Real-time database updates
- ✅ Red warning banner for "waiting_for_checker"
- ✅ Integration with task_checks table
- 🔄 Could add: Email notifications to checker, progress tracking, SLA tracking

## Testing Checklist

- [ ] Modal appears when selecting "Done"
- [ ] Both radio options are clickable
- [ ] Dropdown populates with employees
- [ ] "Assign Now" creates task_check record
- [ ] "Assign Later" sets check_status = 'waiting_for_checker'
- [ ] Red banner appears only when check_status = 'waiting_for_checker'
- [ ] Dropdown in banner assigns checker
- [ ] Banner disappears after assignment
- [ ] Success messages appear
- [ ] Dashboard shows new pending checks
- [ ] Checker can access check on `/check/level1`
