# ✅ FINAL FIX: Add Supabase JWT Secret

## 🎉 PROBLEM IDENTIFIED!

Your Supabase tokens use **HS256 algorithm** but we don't have the JWT secret configured!

**Error:**
```
JWT validation failed: InvalidAlgorithmError: The specified alg value is not allowed
```

---

## ✅ SOLUTION (5 Minutes):

### Step 1: Get JWT Secret from Supabase

1. Go to: https://supabase.com
2. Open project: `oyqzmcsmigpekhmlzhoz`
3. Click **"Settings"** (gear icon at bottom left)
4. Click **"API"** in the settings menu
5. Scroll down to **"JWT Settings"** section
6. Find **"JWT Secret"** - it's a long string
7. Click the **copy icon** to copy it

### Step 2: Add to .env File

Open `backend/.env` and add this line (or update if exists):

```env
# Add this line after SUPABASE_SERVICE_ROLE_KEY:
SUPABASE_JWT_SECRET=paste_your_jwt_secret_here_from_step1
```

**Example:**
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
SUPABASE_JWT_SECRET=your-long-jwt-secret-string-here
```

### Step 3: Restart Backend

**In Terminal 11:**
```powershell
# Press Ctrl+C to stop
# Then restart:
python main.py
```

Wait for: `Application startup complete.`

### Step 4: Test - Should Work Now!

1. **Go to:** http://localhost:3000/account
2. **Should see:** NO 403 errors!
3. **Should see:** "Admin" role badge
4. **Backend logs should show:** `JWT validated successfully with HS256`

---

## 🎯 What This Does:

The backend now tries 3 methods to validate JWT:
1. **ES256** with JWKS (Supabase new method)
2. **RS256** with JWKS (fallback)
3. **HS256** with JWT Secret (your Supabase uses this!)

Once you add the JWT secret, **HS256 validation will work** and all 403 errors will disappear!

---

## 📋 Quick Reference:

**Where to find JWT Secret:**
```
Supabase Dashboard 
→ Settings (gear icon) 
→ API 
→ JWT Settings 
→ JWT Secret (copy icon)
```

**Where to add it:**
```
backend/.env
→ Add line: SUPABASE_JWT_SECRET=your_secret_here
```

**Then:**
```
Restart backend → Refresh browser → WORKS! ✅
```

---

## 🆘 If You Can't Find JWT Secret in Supabase:

It might be called:
- "JWT Secret"
- "anon public"  
- "service_role secret"

Look in:
- Settings → API → JWT Settings
- Settings → API → Project API keys

Copy the secret that's used to sign JWTs (usually shown with the anon key).

---

**Files Modified:**
- `backend/app/core/security.py` - Now supports ES256, RS256, and HS256
- `backend/app/core/config.py` - Added SUPABASE_JWT_SECRET field

**What You Need to Do:**
1. Get JWT Secret from Supabase Settings → API
2. Add to `backend/.env`
3. Restart backend
4. Everything will work! 🚀

---

**Date:** 2026-01-25  
**Status:** Waiting for JWT Secret to be added to .env
