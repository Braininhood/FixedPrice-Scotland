# Complete Setup Guide - FixedPrice Scotland

## Prerequisites
- Supabase account with project created
- Gmail account (for email invoices)
- Backend and frontend running

---

## Step 1: Database Setup (10 minutes)

### A. Access Supabase SQL Editor

1. Go to https://supabase.com
2. Open your project
3. Click "SQL Editor" in left sidebar
4. Click "New Query"

### B. Run Database Setup Script

Copy the entire contents of `DATABASE-SETUP-AUTOMATED.sql` and paste into SQL Editor, then click "Run".

This will:
- Create user profiles for all existing auth users
- Set up automatic profile creation trigger
- Create test users (admin, agent, buyer)
- Verify setup

**OR** manually run these key queries:

```sql
-- 1. Create profiles for existing users
INSERT INTO user_profiles (id, email, full_name, role)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', 'User'),
  'buyer'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles p WHERE p.id = u.id
);

-- 2. Make yourself admin (CHANGE EMAIL)
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'YOUR_EMAIL@example.com';

-- 3. Set up auto-profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), 'buyer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### C. Verify Database Setup

Run this to verify:

```sql
-- Check if profiles were created
SELECT 
  (SELECT COUNT(*) FROM auth.users) as auth_users,
  (SELECT COUNT(*) FROM user_profiles) as user_profiles;
-- Numbers should match!

-- Check your profile
SELECT id, email, role FROM user_profiles WHERE email = 'YOUR_EMAIL@example.com';
-- Should show your email with 'admin' role
```

---

## Step 2: Email Configuration (5 minutes)

### A. Generate Gmail App Password

1. Go to https://myaccount.google.com/security
2. Enable "2-Step Verification" if not already enabled
3. Go to https://myaccount.google.com/apppasswords
4. Select "Mail" and your device
5. Click "Generate"
6. Copy the 16-character password (format: xxxx xxxx xxxx xxxx)

### B. Update Backend .env File

Open `backend/.env` and add/update these lines:

```env
# Email Configuration
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_16_char_app_password_here
MAIL_FROM=noreply@fixedpricescotland.com
MAIL_FROM_NAME=FixedPrice Scotland
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_TLS=True
MAIL_SSL=False
```

**Important:** Remove spaces from the app password!

### C. Restart Backend

```powershell
# In Terminal 11 (backend terminal)
# Press Ctrl+C to stop
# Then restart:
python main.py
```

---

## Step 3: Test Everything (5 minutes)

### Test 1: Login and Profile

1. **Refresh browser** (F5)
2. **Login** at http://localhost:3000/auth/login
3. Should work without errors

### Test 2: Subscription

1. Go to http://localhost:3000/pricing
2. Click "Subscribe" on any plan
3. Should get success message:
   ```
   "Thank you for your interest... 
   An invoice has been sent to your email."
   ```
4. **Check your email inbox** - should receive invoice

### Test 3: Admin Features

1. Go to http://localhost:3000/account
2. Scroll down
3. Should see **"User Management"** section
4. Should see list of users with role dropdown

### Test 4: API Endpoints

Open browser console (F12) and run:

```javascript
// Test authenticated endpoint
fetch('http://localhost:8000/api/v1/users/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
  }
}).then(r => r.json()).then(console.log);
```

Should return your user data, not 403.

---

## Troubleshooting

### Problem: Still getting 403 errors

**Solution:**
1. Logout completely
2. Clear browser data (F12 → Application → Clear storage)
3. Login again
4. Try again

### Problem: Email not sending

**Checklist:**
- [ ] App password copied correctly (no spaces)
- [ ] Gmail 2-Step Verification enabled
- [ ] Backend restarted after .env change
- [ ] Check backend logs for email errors
- [ ] Check spam folder

**Test command:**
```powershell
# In backend directory
python -c "
from app.services.email_service import EmailService
import asyncio
asyncio.run(EmailService.send_invoice_email(
    'your_email@gmail.com',
    'Test User',
    'buyer_monthly',
    19.99,
    'TEST-123'
))
print('Email sent!')
"
```

### Problem: User profiles not created

**Solution:**
```sql
-- Check if trigger exists
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- If missing, run the trigger creation SQL again
```

---

## What You Should See After Setup

### ✅ Database
- All auth users have user_profiles entries
- Your account has role='admin'
- Trigger is active for new signups

### ✅ Email
- SMTP configured in .env
- Test email successfully sent
- Subscription invoices arrive in inbox

### ✅ Frontend
- Login works without errors
- No 403 errors on /account
- Admin panel visible (if admin role)
- Subscription flow completes successfully

### ✅ Backend
- No errors in logs
- Email service working
- All endpoints responding correctly

---

## Quick Setup Script

If you want to automate this, use:

```powershell
# Run from project root
cd "d:\FixedPrice Scotland"

# 1. Check backend is running
curl http://localhost:8000/health

# 2. Setup database (you'll need to paste SQL manually in Supabase)
# See DATABASE-SETUP-AUTOMATED.sql

# 3. Configure email (update .env file)
# See backend/.env.example

# 4. Restart backend
cd backend
# Press Ctrl+C in terminal
python main.py
```

---

## Next Steps After Setup

Once setup is complete:

1. **Test all features** - Login, browse, subscribe
2. **Create test listings** - Use `tests/scripts/create-test-listings.py`
3. **Invite test users** - Test different roles
4. **Configure Stripe** (future) - For card payments
5. **Deploy to production** - When ready

---

## Support Files

- `DATABASE-SETUP.sql` - All database queries
- `DATABASE-SETUP-AUTOMATED.sql` - Automated setup script
- `FIX-403-SUBSCRIPTION.md` - Detailed 403 troubleshooting
- `backend/.env.example` - Email configuration template

---

**Estimated Total Time:** 20 minutes  
**Difficulty:** Easy (copy/paste SQL and config)
