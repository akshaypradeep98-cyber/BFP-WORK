# FirmFlow Setup Guide

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Copy your project URL and anon key from Settings > API

## Step 3: Configure Environment Variables

Update `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 4: Create Database Table and Insert Test Users

Go to Supabase > SQL Editor and run this SQL script:

```sql
-- Create employees table
CREATE TABLE employees (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert test users with hashed passwords
-- Password hashes are for: ravi@123 and sneha@123
INSERT INTO employees (username, password_hash, name, email) VALUES
(
  'ravi',
  '$2a$10$QCpfSLmJLMSxFkJvR8mN.eYO3EF5NzJKdGfKTNbz8bD1mZR4aJLwa',
  'Ravi Kumar',
  'ravi@firmflow.com'
),
(
  'sneha',
  '$2a$10$R1Xd8hKbL8KpM2nQ9vX5F.uJf1KbN3sR9cL4eM5dP8qS7tU2vW9He',
  'Sneha Patel',
  'sneha@firmflow.com'
);

-- Create index for faster lookups
CREATE INDEX idx_employees_username ON employees(username);
```

## Step 5: Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You will be automatically redirected to the login page.

## Test Login Credentials

**User 1:**
- Username: `ravi`
- Password: `ravi@123`

**User 2:**
- Username: `sneha`
- Password: `sneha@123`

## Project Structure

```
├── app/
│   ├── login/
│   │   └── page.tsx          # Login page
│   ├── dashboard/
│   │   └── page.tsx          # Dashboard (after login)
│   ├── api/auth/
│   │   └── login/route.ts    # Login API endpoint
│   ├── layout.tsx
│   ├── page.tsx              # Redirects to /login
│   └── globals.css
├── lib/
│   ├── supabase.ts           # Supabase client
│   └── auth.ts               # Password hashing/verification
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── postcss.config.js
```

## Features

✅ Secure password hashing with bcryptjs  
✅ Supabase PostgreSQL database integration  
✅ Cookie-based session management  
✅ Professional dark blue design (#1C3350)  
✅ Error message display  
✅ Responsive layout  
✅ Welcome message with employee name  

## Troubleshooting

### "Server configuration error" on login
- Make sure your `.env.local` file has correct Supabase credentials
- Verify the environment variables are properly set

### "Invalid username or password"
- Check that the employees table exists in Supabase
- Verify the test data was inserted correctly
- Make sure you're using the exact usernames: `ravi` and `sneha`

### Table not found error
- Run the SQL script in Supabase SQL Editor to create the table
- Wait a moment for the schema to sync

## Next Steps

After successful login:
1. You can customize the dashboard page
2. Add more features to the app
3. Connect additional tables and features to Supabase
4. Implement role-based access control
