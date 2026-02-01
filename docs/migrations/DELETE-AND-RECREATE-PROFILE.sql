-- ================================================================
-- FINAL FIX: Delete old profile and create new one with exact auth ID
-- ================================================================
-- Run this in Supabase SQL Editor
-- ================================================================

-- Step 1: Delete ALL profiles for your email (clean slate)
DELETE FROM user_profiles WHERE email = 'dommovoy@gmail.com';

-- Step 2: Create fresh profile with EXACT ID from auth.users
INSERT INTO user_profiles (id, email, full_name, role)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', 'Andrii Berezutskyi'),
  'admin'
FROM auth.users u
WHERE u.email = 'dommovoy@gmail.com';

-- Step 3: Verify the IDs match
SELECT 
  u.id as auth_user_id,
  u.email as auth_email,
  p.id as profile_id,
  p.email as profile_email,
  p.role,
  p.created_at,
  CASE 
    WHEN u.id = p.id THEN '✅ MATCH - CORRECT!' 
    ELSE '❌ MISMATCH - PROBLEM!' 
  END as id_status
FROM auth.users u
INNER JOIN user_profiles p ON u.email = p.email
WHERE u.email = 'dommovoy@gmail.com';

-- ================================================================
-- EXPECTED OUTPUT:
-- ================================================================
-- Should show ONE row with:
-- - auth_user_id = profile_id (SAME VALUE!)
-- - role = admin
-- - id_status = ✅ MATCH - CORRECT!
-- ================================================================
