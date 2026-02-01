-- FixedPrice Scotland - User Setup & Troubleshooting SQL
-- Run these queries in Supabase SQL Editor to diagnose and fix user issues

-- =========================================
-- DIAGNOSTIC QUERIES
-- =========================================

-- 1. Check if your auth user exists
SELECT id, email, created_at, email_confirmed_at
FROM auth.users
WHERE email = 'your_email@example.com';  -- Replace with your email

-- 2. Check if your user profile exists
SELECT id, email, full_name, role, created_at
FROM user_profiles
WHERE email = 'your_email@example.com';  -- Replace with your email

-- 3. Find orphaned auth users (auth user exists but no profile)
SELECT u.id, u.email, u.created_at
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;

-- 4. Check all user profiles and their roles
SELECT id, email, full_name, role, created_at
FROM user_profiles
ORDER BY created_at DESC;

-- =========================================
-- FIXES FOR COMMON ISSUES
-- =========================================

-- FIX 1: Create missing user profile
-- If you have an auth user but no profile, run this:
INSERT INTO user_profiles (id, email, full_name, role)
VALUES (
  'your-supabase-auth-user-id',  -- Get this from auth.users query above
  'your_email@example.com',
  'Your Full Name',
  'buyer'  -- Options: 'admin', 'agent', 'buyer'
);

-- FIX 2: Make yourself an admin
UPDATE user_profiles
SET role = 'admin'
WHERE email = 'your_email@example.com';

-- FIX 3: Bulk create profiles for all auth users without profiles
INSERT INTO user_profiles (id, email, full_name, role)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', 'User'),
  'buyer'  -- Default role
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles p WHERE p.id = u.id
);

-- FIX 4: Update user profile role
UPDATE user_profiles
SET role = 'admin'  -- or 'agent' or 'buyer'
WHERE email = 'your_email@example.com';

-- =========================================
-- AUTOMATED PROFILE CREATION TRIGGER
-- =========================================

-- This trigger automatically creates a user_profile when someone signs up
-- Run this once to set it up:

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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- VERIFICATION QUERIES
-- =========================================

-- Verify trigger was created
SELECT * FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Test: Count users vs profiles (should match after trigger)
SELECT 
  (SELECT COUNT(*) FROM auth.users) as auth_users,
  (SELECT COUNT(*) FROM user_profiles) as user_profiles;

-- List users with their profiles
SELECT 
  u.id,
  u.email as auth_email,
  u.created_at as auth_created,
  p.email as profile_email,
  p.full_name,
  p.role
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- =========================================
-- SUBSCRIPTION QUERIES
-- =========================================

-- Check subscriptions
SELECT 
  s.id,
  s.user_id,
  p.email,
  p.full_name,
  s.plan_type,
  s.status,
  s.created_at,
  s.period_end
FROM subscriptions s
JOIN user_profiles p ON s.user_id = p.id
ORDER BY s.created_at DESC;

-- Check if a user has active subscription
SELECT 
  s.status,
  s.plan_type,
  s.period_end
FROM subscriptions s
WHERE s.user_id = 'your-user-id'  -- Replace with your user ID
  AND s.status = 'active';

-- =========================================
-- CLEANUP QUERIES (USE WITH CAUTION)
-- =========================================

-- Delete test users (CAREFUL!)
-- DELETE FROM user_profiles WHERE email LIKE '%@test.com';
-- DELETE FROM auth.users WHERE email LIKE '%@test.com';

-- Reset all users to buyer role
-- UPDATE user_profiles SET role = 'buyer';

-- Delete all inactive subscriptions
-- DELETE FROM subscriptions WHERE status = 'inactive';

-- =========================================
-- QUICK SETUP FOR TESTING
-- =========================================

-- 1. Make yourself admin
UPDATE user_profiles SET role = 'admin' WHERE email = 'your_email@example.com';

-- 2. Create a test subscription for yourself
INSERT INTO subscriptions (user_id, plan_type, status, period_start, period_end)
SELECT 
  id,
  'buyer_monthly',
  'active',
  NOW(),
  NOW() + INTERVAL '30 days'
FROM user_profiles
WHERE email = 'your_email@example.com';

-- 3. Verify setup
SELECT 
  p.email,
  p.role,
  s.plan_type,
  s.status
FROM user_profiles p
LEFT JOIN subscriptions s ON p.id = s.user_id
WHERE p.email = 'your_email@example.com';
