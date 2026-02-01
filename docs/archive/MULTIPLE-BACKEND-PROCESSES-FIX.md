# 🚨 CRITICAL FIX: Multiple Backend Processes

## THE REAL PROBLEM

You have **3 backend processes** running simultaneously on port 8000! This is causing conflicts and 403 errors.

**PIDs:** 37860, 33212, 46976

---

## ✅ SOLUTION: Clean Restart

### Step 1: I Just Killed All Python Processes

All backend processes are now stopped.

### Step 2: Start Backend CLEANLY

**In Terminal 11 (the one showing backend logs):**

```powershell
# Navigate to backend
cd "D:\FixedPrice Scotland\backend"

# Activate virtual environment
.\venv\Scripts\activate

# Start backend (ONLY ONCE!)
python main.py
```

**WAIT** until you see:
```
INFO:     Application startup complete.
```

**DO NOT start it multiple times!**

### Step 3: Verify ONLY ONE Process

Open a **NEW terminal** and run:

```powershell
netstat -ano | findstr :8000
```

Should show **ONLY ONE** process, like:
```
TCP    0.0.0.0:8000    0.0.0.0:0    LISTENING    12345
```

If you see multiple, kill them again:
```powershell
taskkill /F /IM python.exe
```

Then restart backend (Step 2).

### Step 4: Complete Browser Reset

**CLOSE BROWSER COMPLETELY:**
1. Close ALL Chrome/Edge windows
2. Wait 5 seconds
3. Reopen browser
4. Go to: http://localhost:3000
5. Login at `/auth/login` with `dommovoy@gmail.com`

### Step 5: Verify Success

After login:
- ✅ Role badge: "Admin" (red, not blue)
- ✅ NO 403 errors in Console
- ✅ NO "Failed to load account data"
- ✅ Account page loads successfully

---

## 🎯 Why This Happened

1. Backend was started multiple times
2. Each start created a new process
3. All 3 processes listen on port 8000
4. They conflict with each other
5. Database queries fail → 403 errors

---

## 📋 Checklist

- [ ] All Python processes killed (I did this)
- [ ] Start backend ONCE in Terminal 11
- [ ] Verify only ONE process with netstat
- [ ] Close ALL browser windows
- [ ] Reopen browser and login fresh
- [ ] Check for "Admin" role and no 403 errors

---

## 🆘 If STILL 403 After This

The database might have the wrong profile. Run this in Supabase:

```sql
-- Delete ALL profiles for your email
DELETE FROM user_profiles WHERE email = 'dommovoy@gmail.com';

-- Recreate with correct ID from auth.users
INSERT INTO user_profiles (id, email, full_name, role)
SELECT 
  u.id,
  u.email,
  'Andrii Berezutskyi',
  'admin'
FROM auth.users u
WHERE u.email = 'dommovoy@gmail.com';

-- Verify
SELECT * FROM user_profiles WHERE email = 'dommovoy@gmail.com';
```

---

**CRITICAL: Start backend ONLY ONCE, then close browser completely and login fresh!** 🚀
