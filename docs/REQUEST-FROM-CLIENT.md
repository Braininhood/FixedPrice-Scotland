# Request from Client - API Keys & Services

## What We Need From You

To complete the FixedPrice Scotland application and deploy it to production, we need the following credentials and access. Please provide all items marked as **REQUIRED**.

---

## ✅ What We Already Have

1. ✅ Supabase Project URL
2. ✅ Supabase Anon Key (Publishable)
3. ✅ **Supabase Service Role Key** ✅ **RECEIVED**
4. ✅ OpenAI API Key
5. ✅ Google Maps API Key
6. ✅ Temporary Email (Gmail) for development

---

## ⚠️ REQUIRED - Please Provide

### 1. Supabase Service Role Key ✅ RECEIVED

**What**: Secret key for backend admin operations  
**Status**: ✅ **RECEIVED** - Successfully added to `backend/.env` (secure, gitignored)

**Why Needed**: Backend needs this for admin operations (creating listings, managing users, etc.)

**Security**: ✅ Stored securely in `.env` file (not in git)

---

### 2. Production Email Account ⚠️ CRITICAL

**Current**: Using temporary Gmail for development  
**What We Need**: Professional email service for production

**Options** (choose one):

**Option A: Email Service Provider (Recommended)**
- **SendGrid** (Free: 100 emails/day): https://sendgrid.com
- **Mailgun** (Free: 5,000 emails/month): https://www.mailgun.com
- **AWS SES** (Very affordable): https://aws.amazon.com/ses/

**What to Provide**:
- [ ] SMTP Server/Host
- [ ] SMTP Port (usually 587)
- [ ] Username/Email
- [ ] Password/API Key
- [ ] From Email Address (e.g., `noreply@fixedpricescotland.com`)
- [ ] From Name (e.g., "FixedPrice Scotland")

**Option B: Business Email**
- Professional email account (e.g., Gmail Business, Outlook)
- SMTP credentials

---

### 3. Domain Name ⚠️ CRITICAL

**What**: Registered domain for the application  
**Examples**: `fixedpricescotland.com`, `fixedpricescotland.co.uk`

**What to Provide**:
- [ ] Domain name registered
- [ ] Domain registrar account access (if we need to configure DNS)
- [ ] Or DNS access details

**Where to Register**:
- GoDaddy: https://www.godaddy.com
- Namecheap: https://www.namecheap.com
- Google Domains: https://domains.google

---

### 4. AWS EC2 Instance ⚠️ CRITICAL

**What**: Server for hosting the application  
**Current Plan**: AWS EC2 Free Tier

**What to Provide** (choose one):

**Option A: AWS Account Access**
- [ ] AWS account credentials
- [ ] Or EC2 instance already created
- [ ] Server IP address
- [ ] SSH key pair (.pem file)

**Option B: Server Details**
- [ ] Server IP address or domain
- [ ] SSH access credentials
- [ ] Root/sudo access

**Note**: We can set this up if you provide AWS account access.

---

### 5. JWT Secret Key ⚠️ CRITICAL

**What**: Strong random key for JWT token signing  
**Current**: Using default (not secure for production)

**What to Provide**:
- [ ] Strong random string (32+ characters)
- [ ] Or we can generate one for you

**How to Generate** (if you want to do it):
```bash
# On Windows (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# On Mac/Linux:
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## 🟡 OPTIONAL - For Future Features

### 6. Stripe Account (Optional)

**Status**: Not required now (using bank transfer)  
**When Needed**: When ready to accept card payments

**What to Provide** (when ready):
- [ ] Stripe account created
- [ ] Publishable key (for frontend)
- [ ] Secret key (for backend)
- [ ] Webhook signing secret

**How to Get**:
1. Create account at https://stripe.com
2. Complete business verification
3. Go to Developers → API keys
4. Copy keys

---

### 7. Zoopla API Access (Optional)

**Status**: Requires commercial agreement  
**Current**: Integration code ready, awaiting access

**What to Provide** (after agreement):
- [ ] Commercial agreement with Hometrack
- [ ] Client ID (OAuth2)
- [ ] Client Secret (OAuth2)

**How to Get**:
1. Contact Hometrack: https://www.hometrack.com/contact-us/
2. Request Zoopla Listings API access
3. Negotiate commercial agreement
4. Receive credentials

**Note**: App works without this (using manual listing entry).

---

## 📋 QUICK CHECKLIST

### Required for Production:
- [x] Supabase Service Role Key ✅
- [ ] Production Email Account/SMTP
- [ ] Domain Name
- [ ] AWS EC2 Instance (or hosting)
- [ ] JWT Secret Key

### Optional (Future):
- [ ] Stripe Account
- [ ] Zoopla API Access
- [ ] Other Property Portal APIs

---

## 🔒 SECURITY NOTES

**Important**: 
- ⚠️ Never share credentials via unsecured email
- ✅ Use secure password manager or encrypted file sharing
- ✅ We will store all credentials in `.env` files (not in git)
- ✅ Different credentials for development and production

---

## 📧 HOW TO PROVIDE

**Preferred Methods**:
1. **Secure Password Manager** (1Password, LastPass, Bitwarden)
2. **Encrypted File** (share password separately)
3. **Secure Messaging** (Signal, encrypted email)
4. **In-Person** (if possible)

**Please Provide**:
- All credentials in a structured format
- Clear labels for each credential
- Any additional notes or restrictions

---

## 📞 QUESTIONS?

If you have questions about any requirement:
- Check `docs/client-requirements-checklist.md` for detailed instructions
- Contact development team
- We can help set up accounts if needed

---

## ✅ VERIFICATION

Once you provide credentials, we will:
1. ✅ Test each credential
2. ✅ Verify access works
3. ✅ Configure in environment variables
4. ✅ Confirm application functionality

---

**Thank you for providing these credentials!**
