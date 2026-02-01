# Client Requirements Checklist

## Overview

This document lists all API keys, services, credentials, and access needed from the client for the FixedPrice Scotland application to function properly. Please provide all items marked as **REQUIRED** before deployment.

---

## 🔴 REQUIRED (Critical for MVP)

### 1. Supabase Database & Authentication

**Status**: ✅ Already Provided  
**What We Have**:
- Project URL: `[REDACTED - set in backend/.env as SUPABASE_URL]`
- Publishable API Key: `[REDACTED - set in frontend/.env.local as NEXT_PUBLIC_SUPABASE_ANON_KEY]`

**What We Still Need**:
- [x] **Service Role Key** (for admin operations) ✅ **RECEIVED**
  - Location: Supabase Dashboard → Settings → API → `service_role` key
  - **Why**: Required for backend admin operations, bypassing RLS
  - **Security**: ⚠️ Keep secret, never expose to frontend
  - **Status**: ✅ Added to `backend/.env` (gitignored, secure)

- [ ] **Database Password** (if using direct Postgres connection)
  - Location: Supabase Dashboard → Settings → Database → Database Password
  - **Why**: For direct database connections if needed

**How to Get**:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy the `service_role` key (secret key)

---

### 2. OpenAI API Key

**Status**: ✅ Already Provided  
**What We Have**:
- API Key: `[REDACTED - set in backend/.env as OPENAI_API_KEY]`

**What We Need**:
- [x] **API Key** ✅ (Already provided)
- [ ] **Billing Setup Confirmed**
  - Ensure billing is configured on OpenAI account
  - Check usage limits and quotas
  - Monitor costs (GPT-4o usage)

**How to Verify**:
1. Go to https://platform.openai.com/api-keys
2. Verify key is active
3. Check billing at https://platform.openai.com/account/billing

---

### 3. Google Maps API Key

**Status**: ✅ Already Provided  
**What We Have**:
- API Key: `[REDACTED - set in frontend/.env.local as NEXT_PUBLIC_GOOGLE_MAPS_API_KEY]`

**What We Need**:
- [x] **API Key** ✅ (Already provided)
- [ ] **API Restrictions Configured** (Recommended)
  - Restrict to specific domains
  - Limit to Maps JavaScript API and Geocoding API
- [ ] **Billing Account Setup**
  - Google Cloud billing account
  - $200/month free credit available
  - Monitor usage

**How to Configure**:
1. Go to https://console.cloud.google.com/apis/credentials
2. Click on your API key
3. Set application restrictions (HTTP referrers)
4. Set API restrictions (Maps JavaScript API, Geocoding API)
5. Verify billing is enabled

---

### 4. Email/SMTP Configuration

**Status**: ✅ Temporary Gmail Provided  
**What We Have** (Temporary for Development):
- Email: `[REDACTED - set in backend/.env as MAIL_USERNAME]`
- App Password: `[REDACTED - set in backend/.env as MAIL_PASSWORD]`
- SMTP Server: `smtp.gmail.com`
- Port: `587`

**What We Need for Production**:
- [ ] **Production Email Account**
  - Professional email address (e.g., `noreply@fixedpricescotland.com`)
  - SMTP credentials
  - Or use email service (SendGrid, Mailgun, AWS SES)

**Options**:
1. **Gmail Business** (if using Gmail):
   - Create business Gmail account
   - Generate app-specific password
   - Configure SMTP settings

2. **Email Service Provider** (Recommended):
   - **SendGrid**: https://sendgrid.com (Free tier: 100 emails/day)
   - **Mailgun**: https://www.mailgun.com (Free tier: 5,000 emails/month)
   - **AWS SES**: https://aws.amazon.com/ses/ (Very affordable)
   - **Postmark**: https://postmarkapp.com (Paid, reliable)

**Required Information**:
- [ ] SMTP Server/Host
- [ ] SMTP Port (usually 587 for TLS, 465 for SSL)
- [ ] Username/Email
- [ ] Password/API Key
- [ ] From Email Address
- [ ] From Name (e.g., "FixedPrice Scotland")

---

## 🟡 OPTIONAL (For Future Features)

### 5. Stripe Payment Integration

**Status**: ⏳ Not Yet Configured  
**Current**: Bank transfer invoicing (temporary)

**What We Need** (When Ready for Card Payments):
- [ ] **Stripe Account Created**
  - Go to https://stripe.com
  - Create account
  - Complete business verification

- [ ] **API Keys**:
  - [ ] **Publishable Key** (for frontend)
    - Location: Stripe Dashboard → Developers → API keys
    - Safe to expose in frontend
  - [ ] **Secret Key** (for backend)
    - Location: Stripe Dashboard → Developers → API keys
    - ⚠️ Keep secret, never expose

- [ ] **Webhook Secret**:
  - [ ] Create webhook endpoint in Stripe Dashboard
  - [ ] Set webhook URL: `https://yourdomain.com/api/v1/webhooks/stripe`
  - [ ] Copy webhook signing secret

- [ ] **Products & Prices**:
  - [ ] Buyer Monthly Plan (£9.99/month)
  - [ ] Buyer Yearly Plan (£99.99/year)
  - [ ] Agent Verification Plan (£29.99/month)

**How to Get**:
1. Create account at https://stripe.com
2. Complete business verification
3. Go to Developers → API keys
4. Copy publishable and secret keys
5. Set up webhook endpoint
6. Create products/prices

**Note**: Currently using bank transfer invoicing. Stripe can be added later.

---

### 6. Zoopla API Access

**Status**: ⏳ Requires Commercial Agreement  
**Current**: Integration code prepared, awaiting API access

**What We Need**:
- [ ] **Commercial Agreement with Hometrack**
  - Contact: https://www.hometrack.com/contact-us/
  - Request: Access to Zoopla Listings API
  - Negotiate: Commercial terms and pricing

- [ ] **API Credentials** (After Agreement):
  - [ ] **Client ID** (OAuth2)
  - [ ] **Client Secret** (OAuth2)
  - [ ] API documentation
  - [ ] Rate limit information

**How to Get**:
1. Contact Hometrack: https://www.hometrack.com/contact-us/
2. Request Zoopla Listings API access
3. Negotiate commercial agreement
4. Receive credentials after agreement signed

**Timeline**: 1-2 weeks for agreement, then credentials provided

**Note**: Integration code is ready. App works without this (using manual entry).

---

### 7. Other Property Portal APIs (Future)

**Status**: ⏳ Research Phase  
**Not Required for MVP**

**Potential Sources**:
- [ ] **Rightmove Partner Feed**
  - Requires partnership agreement
  - Contact Rightmove for partnership opportunities

- [ ] **ESPC Data Feed**
  - Contact ESPC for partnership/feed access
  - May offer RSS or data feeds for partners

- [ ] **S1Homes API/Feed**
  - Research required
  - Contact S1Homes for data access

**Note**: MVP uses manual curation. Portal APIs are for future automation.

---

## 🟢 HOSTING & DEPLOYMENT

### 8. Domain Name

**Status**: ⏳ Not Yet Configured

**What We Need**:
- [ ] **Domain Name Registered**
  - Example: `fixedpricescotland.com` or `fixedpricescotland.co.uk`
  - Domain registrar (GoDaddy, Namecheap, etc.)

- [ ] **DNS Configuration**:
  - [ ] A record pointing to server IP
  - [ ] CNAME for www subdomain (optional)
  - [ ] SSL certificate (Let's Encrypt via Certbot)

**How to Get**:
1. Register domain at registrar
2. Configure DNS records
3. Set up SSL certificate

---

### 9. AWS EC2 Instance (Deployment)

**Status**: ⏳ To Be Set Up

**What We Need**:
- [ ] **AWS Account Created**
  - Go to https://aws.amazon.com
  - Create account (Free Tier eligible)

- [ ] **EC2 Instance**:
  - [ ] Instance type: t2.micro or t3.micro (Free Tier)
  - [ ] Operating System: Ubuntu 22.04 LTS
  - [ ] Security Group configured (ports 80, 443, 22, 8000)
  - [ ] Key pair for SSH access

- [ ] **Server Access**:
  - [ ] SSH key pair file (.pem)
  - [ ] Server IP address or domain
  - [ ] Root/sudo access

**How to Get**:
1. Create AWS account
2. Launch EC2 instance (Free Tier)
3. Configure security groups
4. Download key pair
5. See `docs/aws-setup-guide.md` for detailed instructions

---

### 10. SSL Certificate

**Status**: ⏳ To Be Set Up

**What We Need**:
- [ ] **SSL Certificate** (Let's Encrypt - Free)
  - Automatic via Certbot
  - Requires domain name configured
  - Valid for 90 days (auto-renewal)

**How to Get**:
1. Install Certbot on server
2. Run: `sudo certbot --nginx -d yourdomain.com`
3. Configure auto-renewal

---

## 📋 SECURITY & CONFIGURATION

### 11. JWT Secret Key

**Status**: ⚠️ Needs Production Value

**What We Need**:
- [ ] **Strong JWT Secret Key** (for production)
  - Current: Using default (not secure)
  - Generate: Strong random string (32+ characters)
  - **Never commit to git**

**How to Generate**:
```bash
# Generate secure random key
python -c "import secrets; print(secrets.token_urlsafe(32))"
# Or
openssl rand -hex 32
```

---

### 12. CORS Origins

**Status**: ✅ Configured for Development

**What We Need**:
- [ ] **Production Domain(s)**
  - Add production domain to CORS allowed origins
  - Example: `https://fixedpricescotland.com`

**Current (Development)**:
- `http://localhost:3000`
- `http://127.0.0.1:3000`

**Production Needed**:
- [ ] `https://yourdomain.com`
- [ ] `https://www.yourdomain.com` (if using www)

---

## 📊 MONITORING & ANALYTICS (Optional)

### 13. Analytics (Optional)

**Status**: ⏳ Not Required for MVP

**Options**:
- [ ] **Google Analytics**
  - Tracking ID
  - For user behavior analytics

- [ ] **Error Monitoring**:
  - [ ] Sentry (https://sentry.io)
  - [ ] Rollbar
  - [ ] LogRocket

**Note**: Can be added post-MVP.

---

## 📝 SUMMARY CHECKLIST

### Critical (Required for MVP)
- [x] Supabase Project URL ✅
- [x] Supabase Anon Key ✅
- [ ] Supabase Service Role Key ⚠️
- [x] OpenAI API Key ✅
- [x] Google Maps API Key ✅
- [x] Email SMTP (Temporary Gmail) ✅
- [ ] Production Email Account ⚠️
- [ ] JWT Secret (Production) ⚠️
- [ ] Domain Name ⚠️
- [ ] AWS EC2 Instance ⚠️

### Optional (Future Features)
- [ ] Stripe Account & Keys
- [ ] Zoopla API Access (Commercial Agreement)
- [ ] Rightmove Partner Feed
- [ ] ESPC Data Feed
- [ ] Analytics Services

---

## 📧 REQUEST TEMPLATE

Copy and send this to the client:

```
Subject: Required API Keys and Credentials for FixedPrice Scotland

Dear [Client Name],

To complete the deployment of FixedPrice Scotland, we need the following 
credentials and access. Please provide the items marked as REQUIRED:

REQUIRED (Critical):
1. Supabase Service Role Key
   - Location: Supabase Dashboard → Settings → API → service_role key
   - This is needed for backend admin operations

2. Production Email Account
   - SMTP server, username, password
   - Or SendGrid/Mailgun API key

3. Domain Name
   - Registered domain for the application

4. AWS EC2 Access
   - AWS account credentials or EC2 instance details
   - SSH key pair for server access

5. JWT Secret Key
   - Strong random string (we can generate if needed)

OPTIONAL (For Future):
- Stripe account (when ready for card payments)
- Zoopla API access (requires commercial agreement)
- Other property portal APIs

Please provide these credentials securely (not via email if possible).
We recommend using a secure password manager or encrypted file sharing.

Thank you!
```

---

## 🔒 SECURITY NOTES

### ⚠️ Important Security Guidelines

1. **Never Commit Secrets to Git**:
   - All `.env` files are in `.gitignore`
   - Never commit API keys, passwords, or secrets
   - Use `.env.example` for documentation only

2. **Secure Storage**:
   - Store credentials in secure password manager
   - Use environment variables in production
   - Rotate keys regularly
   - Use different keys for development/production

3. **Access Control**:
   - Limit access to credentials
   - Use least privilege principle
   - Monitor API usage
   - Set up alerts for unusual activity

4. **Production Checklist**:
   - [ ] All secrets are in environment variables
   - [ ] No hardcoded credentials
   - [ ] SSL/TLS enabled
   - [ ] CORS properly configured
   - [ ] Rate limiting enabled
   - [ ] Security headers configured
   - [ ] Regular security updates

---

## 📞 CONTACT INFORMATION

### For Questions About Requirements

**Development Team**: [Your Contact]  
**Project**: FixedPrice Scotland  
**Repository**: [GitHub URL]

### Service Provider Contacts

- **Supabase Support**: https://supabase.com/support
- **OpenAI Support**: https://help.openai.com
- **Google Cloud Support**: https://cloud.google.com/support
- **Stripe Support**: https://support.stripe.com
- **Hometrack (Zoopla)**: https://www.hometrack.com/contact-us/

---

## VERSION HISTORY

- **v1.0** (2026-01-24): Initial client requirements checklist
  - Listed all required API keys and services
  - Documented optional/future requirements
  - Added security guidelines
  - Created request template
