# Role-Based System Design - FixedPrice Scotland

## Current User Roles

### 1. **Admin** (`role: 'admin'`)
**Purpose:** Platform management and oversight

**Dashboard Features:**
- ✅ User Management (implemented in `/account`)
  - View all users
  - Change user roles (admin, agent, buyer)
  - Monitor user activity
- ❌ Listings Management (TODO)
  - Approve/reject agent listings
  - Edit any listing
  - Bulk operations
- ❌ Analytics Dashboard (TODO)
  - Platform metrics (total users, listings, subscriptions)
  - Revenue reports
  - Classification accuracy stats

**API Access:**
- ✅ `GET /users/` - List all users
- ✅ `PATCH /users/{id}/role` - Change user roles
- ✅ All standard user endpoints
- ✅ Can see all listings
- ❌ Subscription management for others (TODO)

---

### 2. **Agent** (`role: 'agent'`)
**Purpose:** Real estate agents listing properties

**Dashboard Features:**
- ❌ Agent Dashboard (TODO - needs implementation)
  - My listings (create, edit, delete)
  - Listing analytics (views, inquiries)
  - Performance metrics
- ❌ Create/Edit Listings (TODO)
  - Currently restricted to admin only
  - Should allow agents to create listings
- ❌ Buyer Inquiries (TODO)
  - See who viewed/saved their listings
  - Contact interested buyers

**API Access:**
- ✅ `GET /listings/` - Browse listings
- ❌ `POST /listings/` - Currently requires admin/agent role (needs testing)
- ❌ `PUT /listings/{id}` - Edit own listings
- ❌ `DELETE /listings/{id}` - Delete own listings
- ✅ Basic account management

**What Needs to be Built:**
1. Agent dashboard page (`/agent/dashboard`)
2. Create listing form
3. Manage listings interface
4. Analytics for agent's listings

---

### 3. **Buyer (Subscribed)** (`role: 'buyer'` + active subscription)
**Purpose:** Premium property search with advanced features

**Dashboard Features:**
- ✅ Full Property Search
  - ✅ Advanced filters (confidence levels: explicit, likely)
  - ✅ Success probability analysis
  - ✅ All listing data
- ✅ Saved Searches (implemented)
  - Create custom search criteria
  - Email alerts (backend ready)
- ✅ Account Management
  - Profile settings
  - Subscription management
  - Payment history

**API Access:**
- ✅ `GET /listings/?confidence_level=explicit` - Advanced filtering
- ✅ `GET /subscriptions/me` - View subscription
- ✅ `POST /subscriptions/subscribe` - Subscribe to plans
- ✅ `POST /subscriptions/cancel` - Cancel subscription
- ✅ `GET /users/saved-searches` - Manage saved searches
- ✅ Full access to all buyer features

---

### 4. **Buyer (Free)** (`role: 'buyer'` + no subscription)
**Purpose:** Basic property browsing

**Dashboard Features:**
- ✅ Basic Property Search
  - ✅ Basic filters (postcode, city, price)
  - ❌ No confidence level filtering (403 if attempted)
  - ❌ No success probability details
- ✅ View Listings
  - See all properties
  - View details
  - External links
- ✅ Account Management
  - Upgrade to premium
- ❌ No saved searches
- ❌ No email alerts

**API Access:**
- ✅ `GET /listings/` - Browse without advanced filters
- ❌ `GET /listings/?confidence_level=explicit` - Returns 403
- ✅ `POST /subscriptions/subscribe` - Can subscribe
- ❌ Saved searches (limited functionality)

---

## Issue #1: Subscription 403 Error

### Problem
```
POST /api/v1/subscriptions/subscribe?plan_type=buyer_monthly
HTTP/1.1 403 Forbidden
```

### Why This Happens

The endpoint requires **authentication** (`current_user: dict = Depends(get_current_user)`).

**Possible Causes:**
1. **User not logged in** - No session exists
2. **Session expired** - Token is invalid
3. **User profile missing** - Auth user exists but no profile in `user_profiles` table
4. **Token not being sent** - Frontend issue with apiClient

### Diagnostic Steps

#### Step 1: Check if Logged In
Open browser console and run:
```javascript
// Check if user session exists
const supabase = createClient();
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
```

If `session` is `null`, user needs to login.

#### Step 2: Check Authorization Header
1. Open DevTools (F12)
2. Go to Network tab
3. Try subscribing
4. Click on the `/subscribe` request
5. Check Headers tab → Request Headers
6. Should see: `Authorization: Bearer eyJ...`

If no Authorization header, the frontend isn't sending the token.

#### Step 3: Check User Profile
```sql
-- In Supabase SQL Editor
SELECT * FROM user_profiles WHERE id = 'your-supabase-auth-id';
```

If no results, create profile:
```sql
INSERT INTO user_profiles (id, email, full_name, role)
VALUES ('supabase-auth-user-id', 'user@email.com', 'Full Name', 'buyer');
```

### Solutions

#### Solution A: User Not Logged In
1. Go to `/auth/login`
2. Login with your credentials
3. Try subscribing again

#### Solution B: Clear Session and Re-login
```powershell
# In browser
1. Open DevTools (F12)
2. Application tab
3. Clear all cookies
4. Clear local storage
5. Refresh page
6. Login again
```

#### Solution C: Create Missing User Profile
After signup, Supabase creates an auth user but NOT a profile. You need to:

**Option 1: Manual SQL**
```sql
INSERT INTO user_profiles (id, email, full_name, role)
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name',
  'buyer'
FROM auth.users
WHERE email = 'your_email@example.com'
AND NOT EXISTS (
  SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.users.id
);
```

**Option 2: Database Trigger (Recommended)**
Create a trigger to auto-create profile on signup:

```sql
-- Function to create user profile automatically
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## Issue #2: Email Invoice Not Being Sent

### Current Implementation

When you call `POST /subscriptions/subscribe`:
1. ✅ Generates payment reference
2. ✅ Calculates plan amount
3. ✅ Calls `EmailService.send_invoice_email()`
4. ✅ Returns pending status with instructions

### Why Email Might Not Send

Check `backend/app/services/subscription_service.py`:

```python
try:
    await EmailService.send_invoice_email(...)
except Exception as e:
    # Email failure is caught and logged but doesn't fail the request
    print(f"Failed to send invoice email: {e}")
```

**The email failure is silent!** Check backend logs for errors.

### Common Email Issues

1. **SMTP not configured** - Check `.env`:
   ```
   MAIL_USERNAME=your_email@gmail.com
   MAIL_PASSWORD=your_app_password
   MAIL_FROM=noreply@fixedpricescotland.com
   MAIL_SERVER=smtp.gmail.com
   MAIL_PORT=587
   ```

2. **Email service not initialized** - Check if FastMail is configured

3. **Invalid recipient email** - User profile has no email

### Test Email Functionality

```python
# In backend, add temporary test endpoint
@router.get("/test-email")
async def test_email():
    from app.services.email_service import EmailService
    await EmailService.send_invoice_email(
        email="test@example.com",
        full_name="Test User",
        plan_name="buyer_monthly",
        amount=19.99,
        payment_reference="TEST123"
    )
    return {"status": "email sent"}
```

Then test:
```powershell
curl http://localhost:8000/api/v1/subscriptions/test-email
```

Check backend logs for errors.

---

## Recommended Role-Based Dashboard Structure

### Suggested File Structure

```
frontend/src/app/
├── dashboard/              # Redirect based on role
│   └── page.tsx           # Auto-redirect to role-specific dashboard
├── admin/
│   ├── page.tsx           # Admin dashboard
│   ├── users/
│   │   └── page.tsx       # User management (exists in /account)
│   ├── listings/
│   │   └── page.tsx       # Listings management
│   └── analytics/
│       └── page.tsx       # Platform analytics
├── agent/
│   ├── page.tsx           # Agent dashboard
│   ├── listings/
│   │   ├── page.tsx       # My listings
│   │   ├── create/
│   │   │   └── page.tsx   # Create new listing
│   │   └── [id]/
│   │       └── edit/
│   │           └── page.tsx  # Edit listing
│   └── analytics/
│       └── page.tsx       # My listings analytics
└── buyer/
    ├── page.tsx           # Buyer dashboard (search interface)
    ├── saved/
    │   └── page.tsx       # Saved listings
    └── searches/
        └── page.tsx       # Saved searches
```

### Dashboard Redirect Logic

```typescript
// frontend/src/app/dashboard/page.tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Redirect based on role
    switch (user.role) {
      case 'admin':
        router.push('/admin');
        break;
      case 'agent':
        router.push('/agent');
        break;
      case 'buyer':
        router.push('/listings'); // Main buyer interface
        break;
      default:
        router.push('/');
    }
  }, [user, loading, router]);

  return <div>Redirecting...</div>;
}
```

---

## Next Steps

### Immediate Fixes (Priority 1)

1. **Fix 403 Subscription Error:**
   - ✅ Document diagnostic steps (done above)
   - ⚠️ User action: Clear session and re-login
   - ⚠️ User action: Verify user profile exists in database

2. **Email Invoice:**
   - ✅ Functionality exists
   - ⚠️ Check SMTP configuration in `.env`
   - ⚠️ Add better error logging

### Medium Priority (Priority 2)

3. **Database Trigger for Auto-Profile:**
   ```sql
   CREATE TRIGGER on_auth_user_created
   AFTER INSERT ON auth.users
   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
   ```

4. **Agent Dashboard:**
   - Create `/agent/page.tsx`
   - Add "Create Listing" functionality
   - Test `POST /listings/` with agent role

5. **Move Admin Panel:**
   - Move user management from `/account` to `/admin/users`
   - Create dedicated admin dashboard

### Low Priority (Priority 3)

6. **Analytics Dashboards:**
   - Admin analytics (platform-wide)
   - Agent analytics (per-listing)
   - Buyer analytics (saved searches, market trends)

7. **Enhanced Permissions:**
   - Agents can only edit their own listings
   - Buyers can't see admin features
   - Better error messages for insufficient permissions

---

## Testing Checklist

### Test Subscription Flow
- [ ] Login as buyer
- [ ] Go to `/pricing`
- [ ] Click subscribe
- [ ] Check Network tab for Authorization header
- [ ] Verify 200 OK response
- [ ] Check email inbox for invoice
- [ ] Check backend logs for email errors

### Test Role-Based Access
- [ ] Admin can see user management
- [ ] Admin can change user roles
- [ ] Agent can create listings (when implemented)
- [ ] Buyer (subscribed) can use confidence filters
- [ ] Buyer (free) gets 403 on confidence filters
- [ ] Unauthenticated users see public listings only

---

**Date:** 2026-01-25  
**Status:** ⚠️ Requires user action to fix 403 error + database trigger setup
