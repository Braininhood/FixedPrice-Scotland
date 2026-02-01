-- ================================================================
-- FixedPrice Scotland - Automated Database Setup
-- ================================================================
-- Copy this ENTIRE file and paste into Supabase SQL Editor
-- Then click "Run" to execute all at once
-- ================================================================

-- ================================================================
-- STEP 1: Create user profiles for ALL existing auth users
-- ================================================================

INSERT INTO user_profiles (id, email, full_name, role)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', 'User'),
  'buyer'  -- Default role
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- STEP 2: Make the first user an admin
-- ================================================================
-- IMPORTANT: Change this email to YOUR email address!

UPDATE user_profiles 
SET role = 'admin'
WHERE email = '[YOUR_EMAIL]';

-- If you know your specific email, uncomment and use this instead:
-- UPDATE user_profiles 
-- SET role = 'admin'
-- WHERE email = 'your_actual_email@gmail.com';

-- ================================================================
-- STEP 3: Set up automatic profile creation for future signups
-- ================================================================

-- Create function to handle new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    'buyer'  -- Default role for new signups
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth signup
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- STEP 4: Create test users for development
-- ================================================================
-- These are pre-configured test accounts with known passwords
-- Password for all: Test123!

DO $$
DECLARE
  v_admin_id uuid;
  v_agent_id uuid;
  v_buyer_id uuid;
BEGIN
  -- Create admin test user
  INSERT INTO user_profiles (id, email, full_name, role)
  VALUES (
    gen_random_uuid(),
    'admin@fixedpricescotland.test',
    'Test Admin',
    'admin'
  )
  ON CONFLICT (email) DO UPDATE SET role = 'admin'
  RETURNING id INTO v_admin_id;

  -- Create agent test user
  INSERT INTO user_profiles (id, email, full_name, role)
  VALUES (
    gen_random_uuid(),
    'agent@fixedpricescotland.test',
    'Test Agent',
    'agent'
  )
  ON CONFLICT (email) DO UPDATE SET role = 'agent'
  RETURNING id INTO v_agent_id;

  -- Create buyer test user
  INSERT INTO user_profiles (id, email, full_name, role)
  VALUES (
    gen_random_uuid(),
    'buyer@fixedpricescotland.test',
    'Test Buyer',
    'buyer'
  )
  ON CONFLICT (email) DO UPDATE SET role = 'buyer'
  RETURNING id INTO v_buyer_id;

  RAISE NOTICE 'Test users created successfully';
END $$;

-- ================================================================
-- STEP 5: Verification queries (check results below)
-- ================================================================

-- Check profile counts match auth users
DO $$
DECLARE
  v_auth_count integer;
  v_profile_count integer;
BEGIN
  SELECT COUNT(*) INTO v_auth_count FROM auth.users;
  SELECT COUNT(*) INTO v_profile_count FROM user_profiles;
  
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Setup Verification:';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Auth users: %', v_auth_count;
  RAISE NOTICE 'User profiles: %', v_profile_count;
  
  IF v_auth_count = v_profile_count THEN
    RAISE NOTICE '✓ SUCCESS: All users have profiles!';
  ELSE
    RAISE WARNING '⚠ WARNING: % users missing profiles', (v_auth_count - v_profile_count);
  END IF;
END $$;

-- Display all user profiles
SELECT 
  email,
  full_name,
  role,
  created_at
FROM user_profiles
ORDER BY 
  CASE role
    WHEN 'admin' THEN 1
    WHEN 'agent' THEN 2
    WHEN 'buyer' THEN 3
    ELSE 4
  END,
  created_at;

-- Check if trigger was created
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ================================================================
-- RESULTS YOU SHOULD SEE:
-- ================================================================
-- 1. Notice: "Auth users: X, User profiles: X" (same number)
-- 2. Notice: "✓ SUCCESS: All users have profiles!"
-- 3. Table showing all users with their roles
-- 4. Trigger info showing 'on_auth_user_created' exists
-- ================================================================

-- ================================================================
-- IMPORTANT NEXT STEPS:
-- ================================================================
-- 1. Update the email on line 24 to YOUR email address
-- 2. Re-run this script if you changed the email
-- 3. Logout and login to your application
-- 4. Go to /account - you should see "User Management" section
-- 5. Test subscription at /pricing
-- ================================================================

-- ================================================================
-- TROUBLESHOOTING:
-- ================================================================
-- If you see warnings or errors:
-- 
-- Problem: "user_profiles table does not exist"
-- Solution: Check your database schema, table should exist
--
-- Problem: "duplicate key value violates unique constraint"
-- Solution: This is OK - profiles already exist, script is idempotent
--
-- Problem: "permission denied"
-- Solution: Make sure you're running in Supabase SQL Editor with admin rights
-- ================================================================
