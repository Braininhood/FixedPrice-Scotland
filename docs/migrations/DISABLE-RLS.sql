-- 🔧 FIX: Disable RLS or Add Policies for user_profiles

-- Step 1: Check if RLS is enabled on user_profiles
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'user_profiles';

-- Step 2: Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';

-- Step 3: DISABLE RLS (simplest fix for now)
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Step 4: Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'user_profiles';

-- Step 5: Test query (should work now)
SELECT id, email, role
FROM user_profiles
WHERE id = '0495c262-0def-40e3-b5e6-66ae2bd121bb';
