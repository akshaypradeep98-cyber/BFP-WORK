# FirmFlow Login - Quick Start

## 🚀 Get Running in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Get Supabase Credentials

1. Go to https://supabase.com and sign up (or log in)
2. Create a new project
3. Wait for the project to initialize (2-3 minutes)
4. Go to **Settings** > **API**
5. Copy the following and save them:
   - **Project URL** (under "Your API reference")
   - **anon public** key (under "Project API keys")

### Step 3: Set Up Environment Variables

Edit `.env.local` and paste your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Example:
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefg123456.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 4: Create Database Table

In Supabase:

1. Go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy the entire content from `SUPABASE_SETUP.sql` in this project
4. Paste it into the SQL Editor
5. Click **Run**
6. You should see 2 rows inserted (ravi and sneha)

Or run this SQL directly:

```sql
CREATE TABLE IF NOT EXISTS employees (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_username ON employees(username);

DELETE FROM employees WHERE username IN ('ravi', 'sneha');

INSERT INTO employees (username, password_hash, name, email) VALUES
('ravi', '$2a$10$QCpfSLmJLMSxFkJvR8mN.eYO3EF5NzJKdGfKTNbz8bD1mZR4aJLwa', 'Ravi Kumar', 'ravi@firmflow.com'),
('sneha', '$2a$10$R1Xd8hKbL8KpM2nQ9vX5F.uJf1KbN3sR9cL4eM5dP8qS7tU2vW9He', 'Sneha Patel', 'sneha@firmflow.com');
```

### Step 5: Start the App

```bash
npm run dev
```

Open http://localhost:3000 in your browser. You'll be redirected to the login page.

## 📝 Test Login

Use these credentials to test:

**User 1:**
- Username: `ravi`
- Password: `ravi@123`
- Name: Ravi Kumar

**User 2:**
- Username: `sneha`
- Password: `sneha@123`
- Name: Sneha Patel

## 🎯 What You Get

✅ **Login Page** (`/login`)
- Professional design with dark blue header
- Username and password inputs
- Error message display
- Test credentials shown below form

✅ **Dashboard Page** (`/dashboard`)
- Welcome message with employee name
- Logout button
- Sample dashboard cards

✅ **Authentication API** (`/api/auth/login`)
- Secure password verification with bcrypt
- Cookie-based session management
- Error handling

✅ **Security Features**
- Passwords hashed with bcryptjs (10 rounds)
- HttpOnly cookies for session tokens
- Middleware-based route protection
- Automatic redirect to login for unauthorized access

## 📁 File Structure

```
├── app/
│   ├── login/page.tsx                 # Login page
│   ├── dashboard/page.tsx             # Dashboard (protected)
│   ├── api/auth/login/route.ts        # Login API endpoint
│   ├── layout.tsx
│   ├── page.tsx                       # Redirects to /login
│   └── globals.css
├── lib/
│   ├── supabase.ts                    # Supabase client
│   ├── auth.ts                        # Password utilities
├── middleware.ts                      # Route protection
├── package.json
├── .env.local                         # Your credentials (gitignored)
└── SUPABASE_SETUP.sql                # Database setup script
```

## 🐛 Troubleshooting

### "Server configuration error" appears on login
**Problem:** Supabase credentials not set up correctly

**Solution:**
1. Check `.env.local` has both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Verify they match your Supabase project settings
3. Restart the dev server (Ctrl+C, then `npm run dev`)

### "Invalid username or password" for both users
**Problem:** Database table not created or populated

**Solution:**
1. Go to Supabase > SQL Editor
2. Run the full `SUPABASE_SETUP.sql` script
3. Go to Supabase > Tables > employees
4. Verify 2 rows exist with usernames "ravi" and "sneha"
5. Try logging in again

### Page shows "Loading..." forever
**Problem:** Not authenticated

**Solution:**
1. Clear browser cookies: DevTools > Application > Cookies > Delete all
2. Try logging in again
3. Check browser console for errors (F12)

### Can't find "ravi" username
**Problem:** Typo in SQL script or incorrect data

**Solution:**
1. Go to Supabase > Tables > employees
2. Click the "employees" table
3. Verify rows exist with exact usernames "ravi" and "sneha"
4. If not, run the SQL script again from SUPABASE_SETUP.sql

## 📚 Next Steps

After login works:

1. **Customize Dashboard** - Edit `app/dashboard/page.tsx`
2. **Add More Pages** - Create new routes in the `app/` directory
3. **Connect More Data** - Create additional tables in Supabase
4. **Add Features** - Implement business logic specific to FirmFlow

## 🔒 Security Notes

- Passwords are hashed with bcryptjs (10 rounds)
- Sessions use HttpOnly cookies
- Routes are protected by middleware
- Never commit `.env.local` to git

## 📞 Support

If something doesn't work:

1. Check the browser console (F12) for error messages
2. Check the terminal running `npm run dev` for server errors
3. Verify all environment variables in `.env.local`
4. Make sure the employees table exists in Supabase with test data
5. Restart the development server

---

**That's it! You should now have a working FirmFlow login system.** 🎉
