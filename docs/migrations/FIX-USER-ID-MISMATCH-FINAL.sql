-- 🔧 FIX USER ID MISMATCH
-- Your JWT contains: 0495c262-0def-40e3-b5e6-66ae2bd121bb
-- But your profile has a different ID

-- Step 1: Check what's in auth.users for your email
SELECT 
  id as auth_user_id, 
  email, 
  created_at,
  raw_user_meta_data->>'full_name' as full_name
FROM auth.users
WHERE email = 'dommovoy@gmail.com';

-- Step 2: Check what's in user_profiles for your email
SELECT 
  id as profile_id,
  email,
  role,
  created_at
FROM user_profiles
WHERE email = 'dommovoy@gmail.com';

-- Step 3: DELETE the wrong profile (if it exists)
DELETE FROM user_profiles WHERE email = 'dommovoy@gmail.com';

-- Step 4: CREATE profile with the CORRECT ID from JWT
INSERT INTO user_profiles (id, email, full_name, role)
VALUES (
  '0495c262-0def-40e3-b5e6-66ae2bd121bb',
  'dommovoy@gmail.com',
  'Andrii Berezutskyi',
  'admin'
);

-- Step 5: VERIFY the IDs match now
SELECT 
  u.id as auth_user_id,
  u.email as auth_email,
  p.id as profile_id,
  p.email as profile_email,
  p.role,
  p.created_at,
  CASE 
    WHEN u.id = p.id THEN '✅ IDs MATCH - PERFECT!'
    WHEN p.id IS NULL THEN '❌ NO PROFILE FOUND'
    ELSE '❌ ID MISMATCH - PROBLEM!'
  END as status
FROM auth.users u
LEFT JOIN user_profiles p ON u.email = p.email
WHERE u.email = 'dommovoy@gmail.com';

-- Step 6: Create trigger to prevent this in future (if not exists)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    'buyer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
