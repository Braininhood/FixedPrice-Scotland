# Client Requirements - Quick Reference

## ✅ What We Already Have

1. ✅ **Supabase Project URL**: `https://oyqzmcsmigpekhmlzhoz.supabase.co`
2. ✅ **Supabase Anon Key**: `sb_publishable_p3mqDW9xvvOBuqupcFLJyw_oj5K4TmR`
3. ✅ **OpenAI API Key**: Provided
4. ✅ **Google Maps API Key**: `AIzaSyCHEjIDd9JI0xMOXyp7WILxeFvwUsB---0`
5. ✅ **Email (Temporary)**: Gmail SMTP for development

---

## ⚠️ What We Still Need (Required for Production)

### 1. Supabase Service Role Key ✅
- **Where**: Supabase Dashboard → Settings → API → `service_role` key
- **Why**: Backend admin operations
- **Status**: ✅ **RECEIVED** - Added to backend/.env

### 2. Production Email Account ⚠️
- **Options**: SendGrid, Mailgun, AWS SES, or business email
- **Status**: ⚠️ **NEEDED**

### 3. Domain Name ⚠️
- **Example**: `fixedpricescotland.com`
- **Status**: ⚠️ **NEEDED**

### 4. AWS EC2 Instance ⚠️
- **For**: Hosting the application
- **Status**: ⚠️ **NEEDED**

### 5. JWT Secret Key (Production) ⚠️
- **For**: Security (we can generate if needed)
- **Status**: ⚠️ **NEEDED**

---

## 📋 Optional (Future)

- Stripe Account (for card payments)
- Zoopla API Access (commercial agreement required)

---

## 📄 Detailed Documentation

For complete details, see:
- **`docs/client-requirements-checklist.md`** - Full checklist with instructions
- **`docs/REQUEST-FROM-CLIENT.md`** - Simple request document to send to client
