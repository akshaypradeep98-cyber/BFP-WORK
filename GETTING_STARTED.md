# 🚀 Getting Started with FirmFlow

## Your FirmFlow login system is ready! Follow these steps to get it running.

---

## ⏱️ Time Required: ~10 minutes

### ✅ Step 1: Prepare Supabase (2 minutes)

1. Go to **https://supabase.com**
2. Click **"Sign Up"** (or log in if you have an account)
3. Choose your authentication method
4. Create a new project:
   - **Organization Name**: Your choice (e.g., "FirmFlow")
   - **Project Name**: Your choice
   - **Password**: Generate a strong password
   - **Region**: Choose the closest to you
5. **Wait 2-3 minutes** for the project to initialize
6. Once ready, you'll see the Supabase dashboard

---

## ⏱️ Step 2: Get Your Credentials (2 minutes)

In your Supabase dashboard:

1. Click **Settings** (gear icon, bottom left)
2. Click **API** (left sidebar)
3. You'll see:
   - **Project URL** (under "Your API reference")
   - **Project API KEYS** section with "anon public" key

Copy these two values:
- `NEXT_PUBLIC_SUPABASE_URL` = Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public key

Example values (yours will be different):
```
URL: https://abcdefg123456.supabase.co
KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ⏱️ Step 3: Update Environment File (1 minute)

Open the file `.env.local` in your project folder with a text editor.

Replace the placeholder values with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefg123456.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Save the file.**

---

## ⏱️ Step 4: Create Database Table (3 minutes)

Back in Supabase dashboard:

1. Click **SQL Editor** (left sidebar)
2. Click **"New Query"** button
3. You'll see a blank SQL editor
4. **Copy the entire content** from `SUPABASE_SETUP.sql` in your project
5. **Paste it** into the Supabase SQL editor
6. Click **"Run"** button (or press Ctrl+Enter)

You should see:
```
Success! Rows affected: 2
```

This confirms the test users (ravi and sneha) have been added.

---

## ⏱️ Step 5: Install Dependencies & Start (2 minutes)

Open a **terminal/command prompt** in your project folder:

```bash
npm install
```

Wait for installation to complete (this might take a minute).

Then start the development server:

```bash
npm run dev
```

You should see:
```
> ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

---

## ⏱️ Step 6: Test the Login (remaining time)

1. Open your browser to **http://localhost:3000**
2. You should be redirected to **http://localhost:3000/login**
3. You'll see the FirmFlow login page with:
   - Username field
   - Password field
   - Login button
   - Test credentials displayed below

### Test Login #1 - Ravi

```
Username: ravi
Password: ravi@123
```

After clicking Login, you should see:
- Page redirects to `/dashboard`
- Welcome message: **"Welcome Ravi Kumar! 👋"**
- Dashboard cards showing (Active Cases: 0, Pending Tasks: 0, etc.)
- Logout button in top right

### Test Login #2 - Sneha

Click **Logout**, then try:

```
Username: sneha
Password: sneha@123
```

You should see:
- Page redirects to `/dashboard`
- Welcome message: **"Welcome Sneha Patel! 👋"**
- Same dashboard layout

---

## ✅ Success Checklist

Check off each item as you complete it:

- [ ] Created Supabase account and project
- [ ] Copied Supabase URL and API key
- [ ] Updated `.env.local` with Supabase credentials
- [ ] Ran `SUPABASE_SETUP.sql` in Supabase
- [ ] Ran `npm install` successfully
- [ ] Started dev server with `npm run dev`
- [ ] Opened http://localhost:3000
- [ ] Redirected to login page
- [ ] Logged in with ravi/ravi@123
- [ ] Saw welcome message for Ravi Kumar
- [ ] Logged out
- [ ] Logged in with sneha/sneha@123
- [ ] Saw welcome message for Sneha Patel
- [ ] Logout button works

**All checked? 🎉 You're done!**

---

## 🐛 Something Not Working?

### Issue: "Server configuration error" on login

**Fix**: Update `.env.local` with correct Supabase credentials and restart dev server

### Issue: "Invalid username or password"

**Fix**: Run the SQL script from `SUPABASE_SETUP.sql` in Supabase SQL Editor again

### Issue: Page shows "Loading..." forever

**Fix**: Clear browser cookies (DevTools > Application > Cookies > Delete all) and try logging in again

### Issue: "npm: command not found"

**Fix**: Install Node.js from https://nodejs.org/ (choose LTS version)

### Issue: Dev server won't start

**Fix**: 
1. Kill the current server (Ctrl+C)
2. Delete `node_modules` folder
3. Run `npm install` again
4. Run `npm run dev`

---

## 📚 Next Steps

Now that login is working:

1. **Customize the dashboard** - Edit `app/dashboard/page.tsx`
2. **Add more pages** - Create new files in `app/` folder
3. **Connect real data** - Create more tables in Supabase
4. **Add features** - Implement business logic specific to FirmFlow

---

## 📖 Documentation Files

- **QUICKSTART.md** - Quick reference guide
- **FILES_CREATED.md** - List of all files created
- **API_DOCUMENTATION.md** - API endpoint reference
- **SETUP_GUIDE.md** - Detailed setup guide

---

## 🎯 Architecture Overview

```
Browser
  ↓
  ├─→ /login (Public) ←─ Shows username/password form
  │     ↓
  │     POST /api/auth/login ←─ API validates credentials
  │     ↓
  │     Queries Supabase Database ←─ Finds employee record
  │     ↓
  │     Verifies password with bcrypt ←─ Checks if password matches
  │     ↓
  │     Sets session cookie ←─ Stores employee_id & name
  │     ↓
  └─→ /dashboard (Protected) ←─ Shows welcome message
        ↓
        Middleware checks cookie ←─ Verifies user is logged in
        ↓
        Display dashboard ←─ Shows employee data
```

---

## 🔐 Security Features

✅ **Passwords hashed with bcryptjs** (10 rounds)
✅ **Secure HttpOnly cookies** (prevent XSS)
✅ **Protected routes** (middleware checks authentication)
✅ **Database validation** (no hardcoded users)
✅ **CSRF protection** (SameSite=Lax cookies)

---

**Questions? Check the troubleshooting section in SETUP_GUIDE.md**

**Ready to build? Start with QUICKSTART.md** 🚀
