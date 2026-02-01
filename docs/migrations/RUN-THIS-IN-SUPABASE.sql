-- ================================================================
-- COPY THIS ENTIRE FILE AND PASTE INTO SUPABASE SQL EDITOR
-- ================================================================
-- Your email: [YOUR_EMAIL]
-- Time: 5 minutes
-- ================================================================

-- Step 1: Create profiles for all existing auth users
INSERT INTO user_profiles (id, email, full_name, role)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', 'User'),
  'buyer'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Make YOU an admin
UPDATE user_profiles 
SET role = 'admin'
WHERE email = '[YOUR_EMAIL]';

-- Step 3: Create trigger for future users
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
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Verify setup
SELECT 
  (SELECT COUNT(*) FROM auth.users) as auth_users,
  (SELECT COUNT(*) FROM user_profiles) as user_profiles,
  (SELECT COUNT(*) FROM user_profiles WHERE role = 'admin') as admins;

-- Step 5: Check YOUR profile
SELECT email, role, created_at FROM user_profiles WHERE email = '[YOUR_EMAIL]';

-- ================================================================
-- EXPECTED OUTPUT:
-- ================================================================
-- Query 1-3: Should complete without errors
-- Query 4: Should show equal numbers for auth_users and user_profiles
-- Query 5: Should show: [YOUR_EMAIL] | admin | [timestamp]
-- ================================================================
