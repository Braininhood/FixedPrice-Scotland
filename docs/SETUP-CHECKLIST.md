# 🚀 Quick Setup Checklist

Use this checklist to set up your FixedPrice Scotland application.

---

## ☐ Step 1: Database Setup (10 min)

### What You Need:
- [ ] Supabase account
- [ ] Your project open in browser
- [ ] SQL Editor access

### Actions:
1. [ ] Open Supabase → Your Project → SQL Editor
2. [ ] Click "New Query"
3. [ ] Open `DATABASE-SETUP-AUTOMATED.sql` in your editor
4. [ ] **IMPORTANT:** Change line 24 - replace `CHANGE_THIS_TO_YOUR_EMAIL@example.com` with YOUR email
5. [ ] Copy the entire file contents
6. [ ] Paste into Supabase SQL Editor
7. [ ] Click "Run" button
8. [ ] Check output - should see "✓ SUCCESS: All users have profiles!"

### Verify:
```sql
-- Run this to verify your admin role
SELECT email, role FROM user_profiles WHERE email = 'YOUR_EMAIL';
-- Should show: your_email | admin
```

**Expected result:** ✅ All auth users have profiles, you are admin, trigger is active

---

## ☐ Step 2: Email Configuration (5 min)

### What You Need:
- [ ] Gmail account (or other SMTP provider)
- [ ] Access to backend/.env file

### Actions:

#### A. Generate Gmail App Password

1. [ ] Go to https://myaccount.google.com/security
2. [ ] Enable "2-Step Verification" (if not already)
3. [ ] Go to https://myaccount.google.com/apppasswords
4. [ ] Select "Mail" and your device
5. [ ] Click "Generate"
6. [ ] **Copy the 16-character password** (format: xxxx xxxx xxxx xxxx)

#### B. Update .env File

1. [ ] Open `backend/.env` in your editor
2. [ ] Find or add these lines:

```env
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=abcdefghijklmnop
MAIL_FROM=noreply@fixedpricescotland.com
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
```

**Important:** Remove spaces from app password!

3. [ ] Save the file

#### C. Restart Backend

1. [ ] Go to Terminal 11 (backend terminal)
2. [ ] Press `Ctrl+C` to stop server
3. [ ] Run: `python main.py`
4. [ ] Wait for "Application startup complete"

**Expected result:** ✅ Backend restarts without email errors

---

## ☐ Step 3: Test Everything (5 min)

### Test 1: Login
- [ ] Open browser: http://localhost:3000
- [ ] Click "Login"
- [ ] Enter your credentials
- [ ] Should login successfully

### Test 2: Check Admin Access
- [ ] Go to: http://localhost:3000/account
- [ ] Scroll to bottom of page
- [ ] Should see **"User Management"** section
- [ ] Should see list of users with role dropdowns

### Test 3: Test Subscription Flow
- [ ] Go to: http://localhost:3000/pricing
- [ ] Click "Subscribe" on any plan
- [ ] Should see success message
- [ ] **Check your email inbox** - should receive invoice with bank details

### Test 4: Check API (Optional)
Open browser console (F12) and paste:

```javascript
// Should return your user data, not 403
fetch('http://localhost:8000/api/v1/users/me', {
  headers: {
    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
  }
}).then(r => r.json()).then(console.log);
```

**Expected result:** ✅ No 403 errors, all features working

---

## ☐ Step 4: Final Verification

### Database ✅
- [ ] Run in Supabase SQL Editor:
```sql
SELECT 
  (SELECT COUNT(*) FROM auth.users) as auth_users,
  (SELECT COUNT(*) FROM user_profiles) as profiles,
  (SELECT COUNT(*) FROM user_profiles WHERE role = 'admin') as admins;
```
Expected: auth_users = profiles, admins >= 1

### Email ✅
- [ ] Check backend logs for errors
- [ ] Try subscribing and check email arrives
- [ ] Check spam folder if not in inbox

### Application ✅
- [ ] Browse listings: http://localhost:3000/listings
- [ ] View Privacy Policy: http://localhost:3000/privacy
- [ ] View Terms: http://localhost:3000/terms
- [ ] Test logout (should redirect to /auth/login, not 404)

---

## 🎉 Setup Complete!

Once all boxes are checked, your application is fully configured and ready to use!

### What's Working Now:
✅ User authentication and profiles
✅ Admin user management
✅ Subscription system with email invoices
✅ All API endpoints
✅ Role-based access control

### What to Do Next:
1. Create test listings: `python tests/scripts/create-test-listings.py`
2. Invite team members and assign roles
3. Test all features thoroughly
4. Configure Stripe (future) for card payments
5. Deploy to production when ready

---

## 🆘 Troubleshooting

### Problem: Still getting 403 errors

**Solution:**
1. Logout completely
2. Open DevTools (F12) → Application → Clear all data
3. Close browser completely
4. Reopen and login again

### Problem: Email not sending

**Check:**
- [ ] App password has no spaces
- [ ] 2-Step Verification enabled on Gmail
- [ ] Backend restarted after .env change
- [ ] Check backend terminal for errors
- [ ] Try sending test email:

```python
cd backend
python -c "
from app.services.email_service import EmailService
import asyncio
asyncio.run(EmailService.send_invoice_email(
    'your_email@gmail.com', 'Test', 'buyer_monthly', 19.99, 'TEST'
))
print('✓ Email sent!')
"
```

### Problem: Can't see admin panel

**Solution:**
```sql
-- Verify your role in Supabase
SELECT email, role FROM user_profiles WHERE email = 'YOUR_EMAIL';

-- If not admin, update:
UPDATE user_profiles SET role = 'admin' WHERE email = 'YOUR_EMAIL';
```

Then logout and login again.

---

## 📚 Reference Files

- `SETUP-GUIDE.md` - Detailed setup instructions
- `DATABASE-SETUP-AUTOMATED.sql` - Copy/paste SQL script
- `DATABASE-SETUP.sql` - Manual SQL queries
- `backend/.env.example` - Environment variables template
- `FIX-403-SUBSCRIPTION.md` - Detailed 403 troubleshooting
- `COMPLETE-SUMMARY.md` - All fixes and features

---

**Estimated Time:** 20 minutes
**Difficulty:** ⭐⭐☆☆☆ (Easy - mostly copy/paste)
