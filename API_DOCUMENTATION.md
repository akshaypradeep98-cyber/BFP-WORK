# FirmFlow API Documentation

## Authentication System

### Login Endpoint

**POST** `/api/auth/login`

Authenticates a user with username and password, returns user data and sets session cookie.

#### Request

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ravi",
    "password": "ravi@123"
  }'
```

#### Request Body

```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "ravi",
    "name": "Ravi Kumar",
    "email": "ravi@firmflow.com"
  }
}
```

The response also sets the following cookies:
- `employee_id` - Employee ID (HttpOnly)
- `employee_name` - Employee name (for display)

#### Error Response (401 Unauthorized)

```json
{
  "error": "Invalid username or password"
}
```

#### Error Response (400 Bad Request)

```json
{
  "error": "Username and password are required"
}
```

#### Error Response (500 Server Error)

```json
{
  "error": "Server configuration error"
}
```

Or

```json
{
  "error": "An error occurred during login"
}
```

### Session Management

#### Login Success
- Cookies `employee_id` and `employee_name` are set
- Cookies persist for 7 days
- `employee_id` is HttpOnly (cannot be accessed via JavaScript)
- Client is redirected to `/dashboard`

#### Logout
- Clear cookies by setting `max-age=0`
- Redirect to `/login`
- No server-side logout needed

#### Session Check
- Middleware checks for `employee_id` cookie
- If missing on protected routes, redirect to `/login`
- Dashboard reads `employee_name` cookie for welcome message

## Password Security

### Hashing Algorithm

Bcryptjs with 10 rounds

- **Algorithm**: bcrypt (blowfish cipher)
- **Rounds**: 10
- **Salt**: auto-generated per hash
- **Hash Length**: ~60 characters

### Example Hash

```
Password: ravi@123
Hash: $2a$10$QCpfSLmJLMSxFkJvR8mN.eYO3EF5NzJKdGfKTNbz8bD1mZR4aJLwa

Format: $2a$10$rounds$salt$hash
```

### Verification Process

1. User submits password
2. Fetch user from database using username
3. Use bcrypt.compare() to verify password against stored hash
4. If match, authentication successful
5. If no match, return "Invalid username or password"

## Database Schema

### employees Table

```sql
CREATE TABLE employees (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_employees_username ON employees(username);
```

#### Columns

| Column       | Type                    | Description                |
|--------------|-------------------------|----------------------------|
| id           | BIGSERIAL               | Primary key                |
| username     | VARCHAR(255) UNIQUE     | Login username             |
| password_hash| VARCHAR(255)            | Bcrypt hashed password     |
| name         | VARCHAR(255)            | Employee full name         |
| email        | VARCHAR(255)            | Employee email address     |
| created_at   | TIMESTAMP               | Account creation time      |
| updated_at   | TIMESTAMP               | Last update time           |

## Routes

### Public Routes

- `GET /` - Redirects to `/login`
- `GET /login` - Login page
- `POST /api/auth/login` - Authentication endpoint

### Protected Routes

- `GET /dashboard` - Employee dashboard (requires authentication)

### Middleware Behavior

Middleware runs on all routes:

1. `/login` - Always allowed
2. `/api/auth/login` - Always allowed
3. `/dashboard` - Requires `employee_id` cookie
4. `/` - Redirects to `/login` if not authenticated
5. All other routes - Allowed

## Error Handling

### Invalid Credentials

When username doesn't exist or password is wrong:

```json
{
  "error": "Invalid username or password"
}
```

**Status**: 401 Unauthorized

### Missing Required Fields

```json
{
  "error": "Username and password are required"
}
```

**Status**: 400 Bad Request

### Server Configuration

```json
{
  "error": "Server configuration error"
}
```

**Status**: 500 Internal Server Error

**Cause**: Missing `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Unexpected Errors

```json
{
  "error": "An error occurred during login"
}
```

**Status**: 500 Internal Server Error

## API Integration Examples

### Using JavaScript Fetch

```javascript
async function login(username, password) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Login failed:', data.error);
      return null;
    }

    console.log('Login successful:', data.user);
    return data.user;
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
}
```

### Using cURL

```bash
# Successful login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "ravi", "password": "ravi@123"}' \
  -v

# Failed login (wrong password)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "ravi", "password": "wrongpassword"}' \
  -v
```

### Using Python requests

```python
import requests
import json

url = "http://localhost:3000/api/auth/login"
data = {
    "username": "ravi",
    "password": "ravi@123"
}

response = requests.post(url, json=data)
result = response.json()

if response.status_code == 200:
    print("Login successful:", result['user'])
else:
    print("Login failed:", result['error'])
```

## Security Best Practices

### What We Implement

✅ **Secure Password Hashing**
- Bcryptjs (10 rounds)
- Each password has unique salt
- Slow by design to prevent brute force

✅ **Secure Cookies**
- HttpOnly flag prevents XSS attacks
- Secure flag (in production) requires HTTPS
- SameSite=Lax prevents CSRF attacks

✅ **Input Validation**
- Required fields checked
- Username validated against database

✅ **Error Messages**
- Generic error for invalid credentials
- Specific error for missing fields
- No password hints in responses

### What You Should Add (Future)

⚠️ **Rate Limiting**
- Limit login attempts per IP
- Implement exponential backoff

⚠️ **Account Lockout**
- Lock account after N failed attempts
- Temporary or permanent lockout

⚠️ **Logging & Monitoring**
- Log all login attempts
- Alert on suspicious activity

⚠️ **2FA/MFA**
- Two-factor authentication
- Mobile app authentication

⚠️ **Session Management**
- Refresh tokens
- Token expiration

## Test Data

### Test Users

```
Username: ravi
Password: ravi@123
Name: Ravi Kumar
Email: ravi@firmflow.com

Username: sneha
Password: sneha@123
Name: Sneha Patel
Email: sneha@firmflow.com
```

### Adding More Test Users

1. Generate password hash:
   ```bash
   node scripts/generate-password-hashes.js
   ```

2. Insert into database:
   ```sql
   INSERT INTO employees (username, password_hash, name, email)
   VALUES ('testuser', '$2a$10$...hash...', 'Test User', 'test@firmflow.com');
   ```

## Performance Considerations

### Database Queries

- Index on `username` for fast lookups
- Single query per login attempt
- No N+1 queries

### Password Verification

- Bcrypt is slow by design (security over speed)
- Typical login takes 100-200ms
- Not suitable for high-volume password checking

### Session Storage

- Cookies stored in browser
- No database queries for session validation
- Middleware checks cookies on each request

## Environment Variables

Required:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Optional:

```env
NODE_ENV=development  # development or production
```

## Troubleshooting

### "Server configuration error"

**Cause**: Missing environment variables

**Solution**:
1. Check `.env.local` exists
2. Verify `NEXT_PUBLIC_SUPABASE_URL` is set
3. Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
4. Restart dev server

### "Invalid username or password"

**Cause**: Wrong credentials or user doesn't exist

**Solution**:
1. Check username spelling
2. Verify password is correct
3. Check database for user record

### Login page loads but API calls fail

**Cause**: CORS, network, or configuration issue

**Solution**:
1. Check browser console for errors (F12)
2. Check terminal for server errors
3. Verify Supabase credentials
4. Try a different browser or incognito mode

### Session not persisting

**Cause**: Cookies not set or lost

**Solution**:
1. Check browser allows cookies
2. Check cookie settings in middleware.ts
3. Clear browser cookies and try again
4. Check DevTools > Application > Cookies

---

For more information, see QUICKSTART.md or SETUP_GUIDE.md
