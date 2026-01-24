# FixedPrice Scotland - Tech Stack

## Selected Stack (Option 3: Monorepo)

**Architecture:** Monorepo with separate backend and frontend  
**Frontend:** Next.js (TypeScript)  
**Backend:** Python FastAPI  
**Database:** Supabase (PostgreSQL + Auth + Storage)  
**Deployment:** Vercel (Frontend) + Railway/Render (Backend)

**Why Monorepo:**
- ✅ Best separation of concerns
- ✅ Python for AI/ML tasks (OpenAI integration)
- ✅ TypeScript for frontend
- ✅ Independent scaling of services
- ✅ Better security (API keys stay on backend)
- ✅ Professional, production-ready architecture  

---

## Frontend: Next.js

**Language:** TypeScript  
**Framework:** Next.js 14+ (App Router)  
**Styling:** Tailwind CSS  
**UI Components:** shadcn/ui or Radix UI  
**State Management:** React Context / Zustand (if needed)  
**Forms:** React Hook Form + Zod validation  
**Maps:** Mapbox GL JS or Leaflet  
**Deployment:** Vercel  

**Why Next.js:**
- Server-side rendering (SEO friendly)
- API routes for simple endpoints
- Built-in optimization
- Easy deployment on Vercel
- Great TypeScript support
- Excellent developer experience

---

## Backend: Python (FastAPI)

**Language:** Python 3.11+  
**Framework:** FastAPI  
**API Documentation:** Auto-generated OpenAPI/Swagger  
**Task Queue:** Celery + Redis (for scheduled jobs)  
**HTTP Client:** httpx or requests  
**AI Integration:** OpenAI Python SDK  
**Deployment:** Railway / Render / Fly.io  

**Why FastAPI:**
- Fast and modern Python framework
- Native async/await support
- Automatic API documentation
- Perfect for AI/ML tasks (OpenAI integration)
- Simple syntax, easy to maintain
- Great for data processing

---

## Database: Supabase

**Database:** PostgreSQL (via Supabase)  
**Auth:** Supabase Auth  
**Storage:** Supabase Storage (for images/files)  
**Realtime:** Supabase Realtime (optional, for live updates)  
**Edge Functions:** Supabase Edge Functions (optional)  

**Why Supabase:**
- Managed PostgreSQL database
- Built-in authentication (email, OAuth)
- File storage included
- Free tier sufficient for MVP
- RESTful API auto-generated
- Row-level security for data protection

---

## AI / Classification

**Service:** OpenAI API  
**Integration:** Python SDK (via backend)  
**Models:** GPT-4 or GPT-3.5-turbo (for text classification)  
**Purpose:** Analyze listings to determine fixed-price status  

---

## Automation / Scheduled Tasks

**Option 1:** Celery + Redis (Python backend)  
**Option 2:** GitHub Actions (cron jobs)  
**Option 3:** Make.com / Zapier (no-code integration)  

**Tasks:**
- Daily/weekly sync of new listings
- Trigger AI classification
- Update confidence scores
- Check for price changes

---

## Additional Tools & Services

**Maps:** Mapbox GL JS (better UI) or Leaflet (free alternative)  
**Search/Filter:** PostgreSQL full-text search or Algolia (if scale needed)  
**Payments:** Stripe (subscriptions, one-time payments)  
**Email:** Resend or SendGrid (for alerts)  
**Error Tracking:** Sentry (free tier)  
**Analytics:** PostHog or Google Analytics  
**Version Control:** Git + GitHub  
**Package Manager Frontend:** npm/yarn/pnpm  
**Package Manager Backend:** pip/poetry  
**Environment Variables:** .env files (local) + Vercel/Railway config (production)

---

## Payments & Subscriptions

**Payment Provider:** Stripe  
**Integration:** Stripe API + Stripe Checkout  
**Subscription Models:**
- Buyer Monthly: £5-10/month
- Buyer Yearly: Discounted rate
- Agent Verification: One-time or monthly fee

**Features:**
- Secure payment processing
- Automatic subscription management
- Webhook handling for payment events
- Payment history tracking

---

## User Roles & Permissions

**User Roles:**
- **Public:** Browse listings only
- **Buyer:** Browse + subscription features (saved searches, alerts)
- **Seller:** Free listing submission
- **Agent:** Listing management + verification badge (paid)
- **Admin:** Full system access

**Authentication:** Supabase Auth  
**Authorization:** Row Level Security (RLS) policies  

---

## Project Structure (Monorepo)

```
fixedprice-scotland/
├── frontend/              # Next.js app
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   ├── api/           # Client-side API calls
│   │   └── page.tsx
│   ├── components/
│   ├── lib/
│   │   ├── api/           # API client functions
│   │   ├── supabase.ts
│   │   └── utils.ts
│   ├── public/
│   ├── .env.local
│   ├── next.config.js
│   ├── package.json
│   └── tsconfig.json
├── backend/               # Python FastAPI
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── listings.py
│   │   │   │   ├── classify.py
│   │   │   │   ├── subscriptions.py
│   │   │   │   ├── users.py
│   │   │   │   └── webhooks.py
│   │   ├── core/
│   │   │   ├── config.py   # Settings & env vars
│   │   │   ├── security.py # Auth, JWT, CORS
│   │   │   └── dependencies.py
│   │   ├── models/
│   │   │   ├── listing.py
│   │   │   ├── user.py
│   │   │   └── subscription.py
│   │   ├── services/
│   │   │   ├── classification_service.py
│   │   │   ├── subscription_service.py
│   │   │   ├── postcode_service.py
│   │   │   └── stripe_service.py
│   │   └── utils/
│   ├── tests/
│   ├── .env
│   ├── requirements.txt
│   ├── main.py
│   └── Dockerfile (optional)
├── docs/
├── .gitignore
├── README.md
└── docker-compose.yml (optional, for local dev)
```

---

## Deployment Strategy (Monorepo) - AWS Free Tier

### Frontend Deployment (AWS EC2)
- **Platform:** AWS EC2 (t2.micro - free tier eligible)
- **OS:** Ubuntu Server 22.04 LTS
- **Runtime:** Node.js 20.x
- **Process Manager:** PM2
- **Reverse Proxy:** Nginx
- **SSL:** Let's Encrypt (free)
- **Custom Domain:** Optional (Route 53 or external DNS)

### Backend Deployment (AWS EC2)
- **Platform:** AWS EC2 (same instance or separate)
- **OS:** Ubuntu Server 22.04 LTS
- **Runtime:** Python 3.11
- **Server:** Uvicorn (FastAPI)
- **Process Manager:** Systemd service
- **Reverse Proxy:** Nginx
- **SSL:** Let's Encrypt (free)

### Database (Supabase)
- **Platform:** Supabase Cloud
- **Backups:** Automatic daily backups
- **Scaling:** Auto-scales based on usage
- **Cost:** Free tier available

### AWS Free Tier Eligibility
- **EC2:** 750 hours/month t2.micro (1 instance always on = free)
- **Elastic IP:** Free when attached to running instance
- **Data Transfer:** 100 GB out per month
- **EBS Storage:** 30 GB free
- **Route 53:** Limited free queries
- **Duration:** 12 months for new AWS accounts

### Environment Variables Management
- **Frontend (EC2 .env.local):**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_API_URL` (backend URL: http://ec2-ip:8000 or https://api.yourdomain.com)
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Backend (EC2 .env):**
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)
  - `OPENAI_API_KEY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `JWT_SECRET` (for token verification)
  - `CORS_ORIGINS` (comma-separated: http://ec2-ip,https://yourdomain.com)
  - `ENVIRONMENT=production`
  - `PORT=8000`

**See `aws-setup-guide.md` for detailed deployment instructions.**

---

## Development Workflow (Monorepo)

### Local Development Setup
1. **Clone repository:**
   ```bash
   git clone <repo-url>
   cd fixedprice-scotland
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env  # Add your secrets
   uvicorn app.main:app --reload --port 8000
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   cp .env.local.example .env.local  # Add your config
   npm run dev  # Runs on localhost:3000
   ```

4. **Database:** Use Supabase cloud or local Supabase CLI

### API Communication Flow
- **Frontend → Backend:** 
  - Frontend calls `http://localhost:8000/api/v1/...` (local)
  - Frontend calls `https://api.yourdomain.com/api/v1/...` (production)
  - All requests include JWT token in Authorization header
- **Backend → Supabase:** 
  - Uses service role key for admin operations
  - Validates user JWT tokens from Supabase
- **Backend → OpenAI:** 
  - Direct API calls for classification
  - API key stored in backend environment

### Data Flow
1. **Listing Ingestion:** Admin adds listing → Backend processes → OpenAI classifies → Saves to Supabase
2. **User Browsing:** Frontend calls Backend API → Backend queries Supabase (with RLS) → Returns filtered listings
3. **Subscriptions:** Frontend → Stripe Checkout → Webhook to Backend → Backend updates Supabase

---

## Key Integrations (Monorepo)

### Backend Integrations
- **Backend → Supabase:** 
  - `supabase-py` client library
  - Service role key for admin operations
  - JWT verification for user requests
- **Backend → OpenAI:** 
  - `openai` Python SDK
  - Async API calls for classification
  - Error handling and retries
- **Backend → Stripe:** 
  - `stripe` Python SDK
  - Webhook signature verification
  - Subscription management

### Frontend Integrations
- **Frontend → Backend:** 
  - RESTful API calls using `fetch` or `axios`
  - JWT token included in Authorization header
  - Error handling and retries
- **Frontend → Supabase Auth:** 
  - `@supabase/auth-helpers-nextjs` for authentication
  - Token management
  - Session handling
- **Frontend → Stripe:** 
  - `@stripe/stripe-js` for checkout
  - Only publishable key in frontend  

---

## Security Architecture

### Backend Security
- **API Authentication:** JWT tokens from Supabase Auth
- **API Authorization:** Role-based access control (RBAC)
- **CORS:** Whitelist only Vercel frontend domain
- **Rate Limiting:** Per-IP and per-user rate limits
- **Input Validation:** Pydantic models for all endpoints
- **SQL Injection Protection:** Supabase client (parameterized queries)
- **API Key Security:** All secrets in environment variables, never in code
- **Stripe Webhooks:** Signature verification for all webhook events
- **HTTPS Only:** Enforce HTTPS in production

### Frontend Security
- **Authentication:** Supabase Auth (handles tokens securely)
- **Input Validation:** Zod schemas for forms
- **XSS Protection:** React's built-in escaping + Content Security Policy
- **API Keys:** Only public keys in frontend (Stripe publishable key)
- **Environment Variables:** Next.js handles secrets securely

### Database Security
- **Row Level Security (RLS):** Enforced on all Supabase tables
- **Connection Security:** SSL/TLS for all database connections
- **Service Role:** Only backend uses service role key
- **Anon Key:** Frontend uses anon key with RLS policies

### API Communication Security
- **HTTPS:** All API calls over HTTPS
- **CORS:** Restricted to frontend domain only
- **JWT Verification:** Backend verifies all Supabase JWT tokens
- **Request Validation:** All requests validated before processing

---

## Cost Estimate (MVP) - AWS Free Tier

- **Supabase:** Free tier (500MB database, 2GB bandwidth)
- **AWS EC2:** Free tier (750 hours/month t2.micro)
- **AWS Elastic IP:** Free when attached to running instance
- **AWS Data Transfer:** 100 GB out/month free
- **OpenAI:** Pay-per-use (~$0.01-0.10 per 1K tokens)
- **Mapbox:** Free tier (50K map loads/month)
- **SSL Certificate:** Free (Let's Encrypt)
- **Total MVP:** ~$0-5/month (only OpenAI usage, within free tier for 12 months)
- **After Free Tier:** ~$8-15/month (EC2 instance + data transfer)

---

## Next Steps

1. Set up Supabase project
2. Create database schema
3. Initialize Next.js frontend
4. Set up FastAPI backend
5. Configure OpenAI integration
6. Build classification service
7. Connect frontend to backend
8. Deploy to production
