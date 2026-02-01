# 403 Subscription Error - Quick Fix Guide

## Problem
```
POST /api/v1/subscriptions/subscribe?plan_type=buyer_monthly
HTTP/1.1 403 Forbidden
```

## Most Likely Cause

**Your user profile doesn't exist in the database!**

When you signup with Supabase, it creates an entry in `auth.users` but NOT in `user_profiles`. The backend requires both to work.

---

## Quick Fix (3 Steps)

### Step 1: Get Your Supabase User ID

**In Browser Console (F12):**
```javascript
// Paste this and press Enter
const supabase = window.supabase || (() => {
  const { createClient } = require('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
})();

supabase.auth.getUser().then(({ data }) => {
  console.log('User ID:', data.user?.id);
  console.log('Email:', data.user?.email);
});
```

Copy the User ID and Email that appears.

---

### Step 2: Create Your User Profile

**In Supabase SQL Editor:**

```sql
-- Replace these values with YOUR data from Step 1
INSERT INTO user_profiles (id, email, full_name, role)
VALUES (
  'paste-your-user-id-here',
  'your_email@example.com',
  'Your Full Name',
  'buyer'
);
```

---

### Step 3: Test Subscription

1. **Refresh your browser** (F5)
2. **Try subscribing again**
3. **Should now work!**

Expected response:
```json
{
  "status": "pending_invoice",
  "message": "Thank you for your interest... An invoice has been sent to your email.",
  "payment_reference": "FPS-XXX",
  "amount": 19.99
}
```

---

## Alternative: Automated Fix

### Option A: SQL Script to Fix All Users

Run this in Supabase SQL Editor to create profiles for ALL auth users:

```sql
-- Create profiles for all auth users that don't have one
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

-- Verify it worked
SELECT COUNT(*) as profiles_created FROM user_profiles;
```

---

### Option B: Database Trigger (Best Solution)

Set up automatic profile creation for future signups:

```sql
-- Function to create profile automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    'buyer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

Now ALL future signups will automatically get a user profile!

---

## Verify It's Fixed

### Test 1: Check Your Profile Exists
```sql
SELECT * FROM user_profiles WHERE email = 'your_email@example.com';
```

Should return 1 row with your data.

### Test 2: Test API Endpoint
```powershell
# In terminal, test the endpoint
curl -X POST "http://localhost:8000/api/v1/subscriptions/subscribe?plan_type=buyer_monthly" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Should return 200 OK, not 403.

### Test 3: Test in Browser
1. Login to your account
2. Go to `/pricing`
3. Click "Subscribe" on any plan
4. Should get success message
5. Check email for invoice

---

## If Still Getting 403

### Check Backend Logs

Look in your backend terminal (Terminal 11) for errors like:
```
ERROR - Could not validate credentials
ERROR - User ID not found
ERROR - User profile not found
```

### Check Token is Valid

In browser console:
```javascript
// Check token expiration
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;
const decoded = JSON.parse(atob(token.split('.')[1]));
console.log('Token expires:', new Date(decoded.exp * 1000));
console.log('Token user ID:', decoded.sub);
```

If expired, logout and login again.

---

## Email Invoice Functionality

### What Should Happen

1. ✅ You click "Subscribe"
2. ✅ Backend creates pending subscription
3. ✅ Generates payment reference (e.g., `FPS-12345`)
4. ✅ Sends invoice email with bank transfer details
5. ✅ Returns success message

### If Email Not Received

**Check backend `.env` file:**
```env
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_specific_password
MAIL_FROM=noreply@fixedpricescotland.com
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
```

**Check backend logs for email errors:**
```
Failed to send invoice email: ...
```

**Test email manually:**
- Add test endpoint in `backend/app/api/v1/subscriptions.py`
- Send test invoice
- Check spam folder

---

## Summary

**Most Common Issue:** User profile missing in database

**Quick Fix:**
1. Get your user ID from browser console
2. Run SQL to create profile
3. Refresh and try again

**Permanent Fix:**
- Set up database trigger for auto-profile creation

---

**Files Created:**
- `DATABASE-SETUP.sql` - Complete SQL queries for setup
- `ROLE-BASED-SYSTEM.md` - Full role analysis and design

**Next:** Once profile exists, subscription should work and email invoice will be sent!
