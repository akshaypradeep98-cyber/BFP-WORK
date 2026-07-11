# 📋 BFP Work — CA Firm Practice Management System

**BFP Work** is a modern, web-based practice management system designed specifically for Chartered Accountant (CA) firms. It streamlines task allocation, subtask management, role-based access control, checking workflows, and compliance filing across your entire firm.

## ✨ Key Features

- **Task Allocation & Management**: Admins create and assign tasks from pre-built templates or custom tasks
- **Subtask Checklists**: Auto-filled from templates (GST, ROC, ITR, TDS, Audit, etc.) with time tracking and notes
- **Role-Based Access Control**: Four roles with different permissions (Admin, Manager, Article, Staff)
- **Two-Level Checking Workflow**: Quality assurance through Level 1 (detailed review) and Level 2 (approval)
- **Appointment Scheduling**: Request checking slots, manager accepts, schedule verification times
- **Live Subtask Editing**: Employees freely modify subtasks on their assigned tasks (no approval needed)
- **Billing & Invoicing**: Track payments, generate GST-compliant invoices
- **Team Dashboard**: Workload overview, pending checks, workload distribution at a glance
- **Compliance Templates**: 12+ pre-built templates for GST, Income Tax, TDS, Audit, and ROC filings
- **Audit Trail**: Complete activity log for compliance and accountability

---

## 🚀 Quick Start Setup

### Prerequisites
- Node.js 18+ ([Download](https://nodejs.org))
- Git
- A Supabase account ([Sign up free](https://supabase.com))

### Step-by-Step Installation

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/bfp-work.git
cd bfp-work

# 2. Install dependencies
npm install

# 3. Create Supabase project at https://supabase.com
# - Copy your Project URL and Anon Key from settings

# 4. Create .env.local in project root
echo "NEXT_PUBLIC_SUPABASE_URL=your_url" > .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key" >> .env.local

# 5. Start the development server
npm run dev

# 6. Open http://localhost:3000 or http://localhost:3002 in your browser
```

### 📧 Default Test Credentials

| Role | Username | Password | Access |
|------|----------|----------|--------|
| **Admin** | akshay | akshay@123 | Everything (create tasks, approve, manage firm) |
| **Manager** | kaarthik | kaarthik@123 | Team oversight, Level 2 approvals |
| **Article** | treesa | treesa@123 | Own tasks, Level 1 checks |
| **Staff** | hari | hari@123 | Own tasks only |

> ⚠️ **Before going live**: Change these passwords immediately!

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    BFP Work App                          │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Frontend (Next.js)          Backend (Supabase)          │
│  ┌─────────────────┐        ┌──────────────────┐        │
│  │ Pages & Routes  │───────▶│  PostgreSQL DB   │        │
│  │ Components      │        │  (Tables)        │        │
│  │ React Hooks     │        │                  │        │
│  └─────────────────┘        │  JWT Auth        │        │
│                              │  RLS Policies    │        │
│  ┌─────────────────┐        └──────────────────┘        │
│  │ Tailwind CSS    │                                     │
│  │ Premium Design  │                                     │
│  └─────────────────┘                                     │
│                                                           │
└─────────────────────────────────────────────────────────┘
         │
         │ Deployed to Vercel
         ▼
    bfp-work.vercel.app
```

**Authentication Flow**:
1. User logs in with username + password
2. Backend verifies with bcrypt hashing
3. Session stored in browser cookies
4. All requests include authentication token
5. Supabase RLS policies enforce data access by role

---

## 📖 Pages & Features

| Page | Access | Purpose |
|------|--------|---------|
| **Dashboard** | All | Team workload, pending checks, stats |
| **Tasks** | All | View/create tasks, assignment, subtask management |
| **Task Detail** | Assigned + Admin | Full task, subtask editing, timer, payments |
| **Employees** | Admin | User management, roles, password reset |
| **Clients** | All | Client master, KMP contacts, lead assignment |
| **Templates** | Admin | Create/edit task templates with subtasks |
| **Calendar** | All | Month view of tasks by due date |
| **Billing** | Admin | Payment tracking, reports by client/division |
| **Invoices** | Admin | Generate GST-compliant invoices |
| **Reports** | Admin | Work logs, billed summary, CSV export |
| **Leave** | All | Apply for leave; managers approve/reject |
| **Level 1 Check** | Assigned Checker | Verify completed work (subtask-by-subtask) |
| **Level 2 Approval** | Managers | Confirm Level 1 checks are complete |
| **Appointments** | All | Request/schedule checking slots |
| **DSC Register** | Admin | Digital signature certificate tracking |
| **Activity Log** | Admin | Complete audit trail |
| **Attendance** | All | Login/logout sessions, duration |

---

## 🗂️ Database Schema

**Core Tables:**

| Table | Purpose |
|-------|---------|
| `employees` | User accounts (username, password_hash, role/classification) |
| `clients` | Client master with lead employee assignment |
| `client_kmp` | Key managerial persons for each client |
| `tasks` | Work tasks (title, client, employee, due_date, status) |
| `subtasks` | Task checklist items (text, done, time_minutes, notes, sort_order) |
| `task_templates` | Reusable templates (GST, ROC, ITR, TDS, Audit, etc.) |
| `template_subtasks` | Template subtask library |
| `task_checks` | Two-level check/approval workflow records |
| `subtask_verifications` | Track which subtasks were verified by checker |
| `appointments` | Checking appointment requests & scheduling |
| `divisions` | Team divisions (Audit, Tax, Advisory, etc.) |
| `payments` | Task payment records from clients |
| `dsc_register` | Digital signature certificate tracking |
| `activity_log` | Audit trail of all user actions |
| `leave_requests` | Leave applications & approval workflow |
| `attendance` | Login/logout sessions |

---

## 👥 Role-Based Access Control

### Admin (Akshay)
- ✅ Create/edit/delete tasks from templates
- ✅ Assign tasks to employees
- ✅ Allocate checkers for Level 1 & 2
- ✅ Access all pages
- ✅ Manage templates and compliance

### Manager (Kaarthik)
- ✅ View team's tasks
- ✅ Perform Level 2 approvals
- ✅ Schedule appointments
- ✅ Approve/reject leaves
- ❌ Cannot create tasks

### Article/Staff (Treesa/Hari)
- ✅ View only their assigned tasks
- ✅ Modify subtasks (add, edit, delete, time tracking)
- ✅ Perform Level 1 checks (if assigned)
- ❌ Cannot create tasks

---

## 🔄 Task Workflow

1. **Admin Creates Task** → Select template or create custom
2. **Subtasks Auto-Filled** → All template subtasks copied to the task
3. **Admin Assigns Employee** → Task visible to assigned employee
4. **Employee Completes** → Marks subtasks done, logs time, adds notes
5. **Employee Marks Done** → Clicks "Mark as Done"
6. **Admin Assigns Checker** → Level 1 checker assigned
7. **Level 1 Check** → Checker verifies each subtask, adds notes
8. **Level 2 Approval** → Manager confirms Level 1 complete
9. **Task Approved** ✅ → Ready for billing

---

## 🏅 Checking Workflow

**Level 1 Check (Detailed Review)**
- Subtask-by-subtask verification
- Checker can mark as "verified" or "needs rework"
- Detailed notes on each subtask
- Full audit trail preserved

**Level 2 Approval (Manager Sign-Off)**
- Review Level 1 check report
- Confirm quality acceptable
- Sign off on completion
- Can reassign checker if unavailable

**Appointment System**
- Checkers request appointment slots
- Manager accepts and schedules time
- Blocks visible to all team members
- Ensures quality checks are scheduled

---

## 📁 File Structure

```
bfp-work/
├── /app                  # Next.js App Router pages
│   ├── /api              # Backend API endpoints
│   ├── /dashboard        # Dashboard
│   ├── /tasks            # Tasks & task detail
│   ├── /employees        # Employee management
│   ├── /templates        # Template management
│   ├── /check            # Level 1 & 2 checking
│   └── ...
├── /components           # Reusable React components
├── /lib                  # Utilities & helpers
│   ├── auth.ts           # Auth utilities & permissions
│   ├── utils.ts          # General utilities
│   └── taskTemplates.ts  # Template logic
├── /public               # Static files
├── .env.local            # Environment variables (DO NOT COMMIT)
├── package.json          # Dependencies
├── tailwind.config.js    # Tailwind CSS
└── README.md             # This file
```

---

## 🎨 Design System

**Colors:**
- Navy (#2C3A4A) — Primary, headers
- Clay (#C89B6A) — Accents, highlights
- Cream (#FAF9F6) — Page background
- Sage Green (#5B8266) — Success
- Terracotta (#B0654F) — Errors

**Typography:**
- Font: Inter (Google Fonts)
- Weights: 400, 500 only
- Responsive sizing

**Components:**
- `.card` — Standard card styling
- `.btn-primary` — Navy button
- `.btn-accent` — Special actions
- `.pill-sage` / `.pill-terracotta` — Status badges

---

## 🚢 Deployment to Vercel

```bash
# 1. Push to GitHub
git add .
git commit -m "Deploy"
git push origin main

# 2. Import in Vercel: https://vercel.com/import
# 3. Add environment variables:
#    - NEXT_PUBLIC_SUPABASE_URL
#    - NEXT_PUBLIC_SUPABASE_ANON_KEY

# 4. Auto-deploys on every git push
# Your app is live at: https://your-project.vercel.app
```

---

## ⚠️ Before Going Live

- [ ] Enable Row-Level Security (RLS) on all Supabase tables
- [ ] Change all test passwords
- [ ] Verify templates match your firm's processes
- [ ] Test role access with real employees
- [ ] Set up SSL certificate (HTTPS)
- [ ] Backup Supabase database regularly
- [ ] Review audit logs
- [ ] Train team on the system

---

## 🛠️ Common Tasks

**Add a New Page:**
```bash
mkdir -p app/newpage
touch app/newpage/page.tsx
# Add your React component
```

**Create Task Template:**
- Login as admin
- Click "Templates" in navbar
- Add category, name, and subtasks

**Deploy Updates:**
```bash
git push origin main  # Vercel auto-deploys
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection failed | Check `.env.local` SUPABASE_URL and ANON_KEY |
| Invalid credentials | Verify employee exists with correct username/password |
| Task not visible | Check task's employee_id matches logged-in user |
| Buttons not working | Open F12 console, check permissions |
| Styling wrong | Clear cache (Ctrl+Shift+R), restart dev server |

---

## 📞 Support

- **Questions?** Contact Akshay (admin)
- **Bugs?** Report to team
- **Features?** Submit as GitHub issue

---

## 📜 License

**Private & Proprietary** — BFP CA Firm

---

## 🔗 Links

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [Vercel Docs](https://vercel.com/docs)

---

**Last Updated:** July 11, 2026  
**Status:** ✅ Production Ready
