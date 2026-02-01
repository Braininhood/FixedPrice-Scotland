# 🔍 DIAGNOSTIC: Why 403 Errors Persist

## The Real Problem

Your JWT token is **valid** but when the backend tries to fetch your **user profile** from the database, something is mismatched.

### How Authentication Works:

1. ✅ Frontend gets JWT from Supabase Auth
2. ✅ Backend validates JWT token (works!)
3. ❌ Backend looks up user in `user_profiles` table → **NOT FOUND** → 403

---

## 🔴 The Issue: User ID Mismatch

The SQL script created profiles for users in `auth.users`, but your **current login** might be using a **different user ID**.

### Let's Verify:

Run this in Supabase SQL Editor:

```sql
-- Check all auth users
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;

-- Check all user profiles  
SELECT id, email, role, created_at FROM user_profiles ORDER BY created_at DESC;

-- Find mismatches
SELECT 
  u.id as auth_id,
  u.email as auth_email,
  p.id as profile_id,
  p.email as profile_email,
  p.role
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
WHERE u.email = '[YOUR_EMAIL]';
```

---

## ✅ SOLUTION: Create Profile for Your EXACT Auth User

### Step 1: Get Your Actual User ID

When you're logged in, open browser console (F12) and run:

```javascript
// Get your current user ID from Supabase
const { data: { user } } = await window.supabase?.auth?.getUser?.() || await (await import('@/lib/supabase')).supabase.auth.getUser();
console.log('My User ID:', user?.id);
console.log('My Email:', user?.email);
```

Copy the User ID that appears.

### Step 2: Create Profile with EXACT ID

In Supabase SQL Editor:

```sql
-- Replace with YOUR actual user ID from Step 1
INSERT INTO user_profiles (id, email, full_name, role)
VALUES (
  'paste-your-actual-user-id-here',
  '[YOUR_EMAIL]',
  'Andrii Berezutskyi',  -- Your name from the database screenshot
  'admin'
)
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

### Step 3: Verify It Worked

```sql
-- Check the profile was created
SELECT id, email, role FROM user_profiles WHERE email = '[YOUR_EMAIL]';
```

---

## 🎯 Alternative: Force Match by Email

If you can't get the user ID, try this:

```sql
-- Create/update profile for your email with correct auth user ID
INSERT INTO user_profiles (id, email, full_name, role)
SELECT 
  u.id,
  u.email,
  'Andrii Berezutskyi',
  'admin'
FROM auth.users u
WHERE u.email = '[YOUR_EMAIL]'
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', 
    email = EXCLUDED.email;
```

---

## 🧪 Test After Fix:

1. **Refresh browser** (F5)
2. **Check console** - should see NO 403 errors
3. **Go to /account** - should work
4. **Role badge** should show "Admin"

---

## 📋 Why This Happened:

The SQL script ran and created profiles, but:
- You might have multiple auth users
- You might have signed up again after the script ran
- The IDs didn't match between auth.users and user_profiles

This fix ensures your **exact current login** has a profile with admin role.

---

**DO THIS NOW:**
1. Run the browser console command to get your user ID
2. Run the SQL with your actual user ID
3. Refresh browser
4. 403 errors should be gone! 🚀
