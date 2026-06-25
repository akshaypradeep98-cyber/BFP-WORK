# Employee Master Setup Guide

## Overview

The Employee Master page is a complete employee management system with add, edit, delete, and search functionality.

## Setup Steps

### Step 1: Update Supabase Database Schema

You need to add new columns to the `employees` table.

1. Go to **Supabase Dashboard > SQL Editor**
2. Click **"New Query"**
3. Copy the entire content from `EMPLOYEE_SCHEMA_UPDATE.sql` in your project folder
4. Paste into the SQL Editor
5. Click **"Run"**

**Or run this SQL directly:**

```sql
-- Add new columns to employees table
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS classification VARCHAR(50),
ADD COLUMN IF NOT EXISTS specialisation VARCHAR(255),
ADD COLUMN IF NOT EXISTS mobile VARCHAR(20),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS weekly_capacity INTEGER DEFAULT 40,
ADD COLUMN IF NOT EXISTS on_leave BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS avatar_color VARCHAR(7);

-- Update existing test users with sample data
UPDATE employees SET
  classification = 'Senior',
  specialisation = 'Corporate Law',
  mobile = '+91 98765 43210',
  date_of_birth = '1990-05-15'::DATE,
  weekly_capacity = 40,
  avatar_color = '#2a5d8f'
WHERE username = 'ravi';

UPDATE employees SET
  classification = 'Manager',
  specialisation = 'GST / Indirect Tax',
  mobile = '+91 87654 32109',
  date_of_birth = '1988-08-22'::DATE,
  weekly_capacity = 40,
  avatar_color = '#1f7a52'
WHERE username = 'sneha';
```

### Step 2: Restart the Development Server

Kill the current server and restart:

```bash
# Press Ctrl+C to stop the current server
# Then run:
npm run dev
```

### Step 3: Access the Employee Master Page

1. Go to **http://localhost:3000**
2. Log in with test credentials:
   - Username: `ravi`, Password: `ravi@123`
   - or Username: `sneha`, Password: `sneha@123`
3. Click the **"Employee Master"** card on the dashboard
4. Or go directly to: **http://localhost:3000/employees**

## Features

### Employee List
- Table showing all employees with:
  - **Employee**: Name with colored circle avatar showing initials
  - **Classification**: Job level (Partner, Manager, Senior, etc.)
  - **Specialisation**: Role/expertise area
  - **Mobile**: Phone number
  - **Email**: Email address
  - **Username**: Login username
  - **Status**: Green "Active" badge or amber "On leave" badge

### Search
- Real-time search box at the top
- Filters by:
  - Employee name
  - Classification
  - Specialisation/Role
  - Username
  - Email

### Add Employee
- Click **"+ Add Employee"** button (top right)
- Opens modal form with fields:
  - Name (required)
  - Email (required)
  - Username (required, must be unique)
  - Password (required for new employees)
  - Mobile
  - Classification (dropdown)
  - Specialisation/Role
  - Date of Birth
  - Weekly Capacity (hours, default 40)
  - On Leave checkbox
- Click "Save" to add new employee
- New employees get a random colored avatar

### Edit Employee
- Click any row in the table to edit
- Opens modal pre-filled with employee data
- All fields editable
- Password field is optional (leave blank to keep current)
- Click "Save" to update
- Click "Delete" to remove employee (asks for confirmation)

### Delete Employee
- In edit modal, click "Delete" button
- Confirms before deletion
- Cannot be undone

## Available Classifications

```
- Partner
- Manager
- Senior
- Semi-Senior
- Article Assistant
- Trainee
- Admin Staff
```

## Avatar Colors

Random colors assigned to new employees:
```
- #2a5d8f (Blue)
- #1f7a52 (Green)
- #c87a23 (Orange)
- #7a4fa0 (Purple)
- #b3392f (Red)
```

## API Endpoints

### Get All Employees
```
GET /api/employees
Returns: Array of all employees
```

### Create New Employee
```
POST /api/employees
Body: {
  name: string (required),
  email: string (required),
  username: string (required, unique),
  password: string (required),
  mobile: string,
  classification: string,
  specialisation: string,
  date_of_birth: string (YYYY-MM-DD),
  weekly_capacity: number (default 40)
}
Returns: Created employee object
```

### Get Single Employee
```
GET /api/employees/[id]
Returns: Employee object
```

### Update Employee
```
PUT /api/employees/[id]
Body: {
  name: string,
  email: string,
  username: string,
  password: string (optional, only if changing),
  mobile: string,
  classification: string,
  specialisation: string,
  date_of_birth: string,
  weekly_capacity: number,
  on_leave: boolean
}
Returns: Updated employee object
```

### Delete Employee
```
DELETE /api/employees/[id]
Returns: { success: true }
```

## File Structure

```
app/
├── employees/
│   ├── page.tsx                    # Main employees page
│   └── components/
│       ├── EmployeeTable.tsx       # Table component
│       └── EmployeeModal.tsx       # Add/Edit form modal
├── api/
│   └── employees/
│       ├── route.ts               # GET all, POST create
│       └── [id]/
│           └── route.ts           # GET, PUT, DELETE single employee
└── dashboard/
    └── page.tsx                   # Updated with Employee Master link

lib/
├── utils.ts                       # Utilities (colors, classifications)
├── auth.ts                        # Password hashing
└── supabase.ts                    # Supabase client

EMPLOYEE_SCHEMA_UPDATE.sql         # Database schema update script
```

## Testing the Feature

### Create a New Employee

1. Click **"+ Add Employee"**
2. Fill in the form:
   - Name: John Doe
   - Email: john@example.com
   - Username: john
   - Password: john@123
   - Mobile: +91 98765 43210
   - Classification: Senior
   - Specialisation: Corporate Law
   - Date of Birth: 1990-01-15
   - Weekly Capacity: 40
3. Click "Save"
4. Employee appears in the table with a random colored avatar

### Search for Employee

1. Type in the search box: "john"
2. Table filters to show only matching employees
3. Clear search to see all

### Edit Employee

1. Click on an employee row
2. Modal opens with their data
3. Change the Classification to "Manager"
4. Click "Save"
5. Table refreshes with updated data

### Delete Employee

1. Click on an employee row
2. Click "Delete" button
3. Confirm the deletion
4. Employee is removed from table

### Toggle On Leave Status

1. Click on an employee row
2. Check the "Mark as on leave" checkbox
3. Click "Save"
4. Status badge changes from "Active" to "On leave"

## Troubleshooting

### "Failed to fetch employees"
- Check Supabase connection credentials in `.env.local`
- Verify database schema was updated with EMPLOYEE_SCHEMA_UPDATE.sql
- Check browser console for error details

### "Username already exists"
- The username field must be unique
- Try a different username

### Avatar colors not showing
- Refresh the page
- Check that avatar_color column was added to database

### Changes not saving
- Check browser console for error messages
- Verify you have permission to write to Supabase database
- Make sure all required fields are filled

### Modal not closing after save
- Check browser console for JavaScript errors
- Try logging out and back in
- Refresh the page

## Future Enhancements

Possible features to add:
- Department/Team assignment
- Reporting manager hierarchy
- Leave balance tracking
- Skills/certifications
- Performance ratings
- Document uploads
- Audit trail of changes
- Bulk import/export
- Scheduled leave calendar

---

**Setup complete! The Employee Master page is ready to use.** 🚀
