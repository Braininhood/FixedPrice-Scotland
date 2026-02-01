-- ================================================================
-- FIX SIGNUP 500 ERROR - Diagnostic & Fix Script
-- ================================================================
-- Run this in Supabase SQL Editor to diagnose and fix signup issues
-- ================================================================

-- ================================================================
-- STEP 1: Check if trigger exists
-- ================================================================
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Expected: Should show one row with trigger details

-- ================================================================
-- STEP 2: Check if function exists
-- ================================================================
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
  AND routine_schema = 'public';

-- Expected: Should show routine_name = 'handle_new_user', security_type = 'DEFINER'

-- ================================================================
-- STEP 3: Check user_profiles table structure
-- ================================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Expected: Should show columns: id (uuid), email (text), full_name (text), role (text), created_at (timestamp)

-- ================================================================
-- STEP 4: Recreate trigger with better error handling
-- ================================================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert user profile
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    'buyer'
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate key errors
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error to Supabase logs but don't fail auth signup
    RAISE WARNING 'Failed to create user profile for %: %', NEW.email, SQLERRM;
    -- Still return NEW to allow auth signup to succeed
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- STEP 5: Verify trigger is active
-- ================================================================
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Expected: Should show trigger is active

-- ================================================================
-- STEP 6: Test the function manually (optional)
-- ================================================================
-- This simulates what happens when a user signs up
-- Replace 'test-id-123' with a UUID if you want to test

-- DO $$
-- DECLARE
--   test_user_id uuid := gen_random_uuid();
-- BEGIN
--   -- Simulate auth.users insert
--   INSERT INTO auth.users (id, email, raw_user_meta_data)
--   VALUES (
--     test_user_id,
--     'test@example.com',
--     '{"full_name": "Test User"}'::jsonb
--   );
--   
--   -- Check if profile was created
--   IF EXISTS (SELECT 1 FROM user_profiles WHERE id = test_user_id) THEN
--     RAISE NOTICE 'SUCCESS: Profile created for test user';
--   ELSE
--     RAISE NOTICE 'FAILED: Profile was not created';
--   END IF;
--   
--   -- Cleanup
--   DELETE FROM user_profiles WHERE id = test_user_id;
--   DELETE FROM auth.users WHERE id = test_user_id;
-- END $$;

-- ================================================================
-- STEP 7: Check for any existing issues
-- ================================================================

-- Check if there are auth users without profiles
SELECT 
  u.id,
  u.email,
  u.created_at as auth_created,
  CASE WHEN p.id IS NULL THEN 'MISSING PROFILE' ELSE 'OK' END as profile_status
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC
LIMIT 10;

-- If you see users without profiles, run this to create them:
-- INSERT INTO user_profiles (id, email, full_name, role)
-- SELECT 
--   u.id,
--   u.email,
--   COALESCE(u.raw_user_meta_data->>'full_name', 'User'),
--   'buyer'
-- FROM auth.users u
-- WHERE NOT EXISTS (SELECT 1 FROM user_profiles p WHERE p.id = u.id)
-- ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- NEXT STEPS AFTER RUNNING THIS SCRIPT:
-- ================================================================
-- 1. Try signing up again
-- 2. Check Supabase Dashboard → Logs → Postgres Logs for any warnings
-- 3. If still failing, check Supabase Dashboard → Authentication → Settings
--    - Make sure "Enable email confirmations" is configured correctly
--    - Check "Site URL" matches your app URL
-- 4. Check browser console for detailed error messages
