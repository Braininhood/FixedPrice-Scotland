# FixedPrice Scotland - Implementation Plan

## Overview

**Timeline:** 2-3 weeks (MVP)  
**Architecture:** Option 3 - Monorepo (Separate Backend & Frontend)  
**Stack:** Next.js (Frontend) + Python FastAPI (Backend) + Supabase (Database)

**Why Monorepo:**
- ✅ Better security (API keys stay on backend)
- ✅ Python for AI/ML tasks (optimal for OpenAI)
- ✅ Independent scaling of services
- ✅ Professional, production-ready architecture
- ✅ Clear separation of concerns

**Deployment:**
- Frontend: AWS EC2 (Free Tier)
- Backend: AWS EC2 (Free Tier)
- Database: Supabase (managed)
- **See `aws-setup-guide.md` for complete AWS deployment instructions**

---

## Phase 1: Project Setup & Infrastructure (Days 1-2)

### Step 1.1: Repository & Project Structure
- [ ] Create GitHub repository
- [ ] Initialize project structure:
  ```
  fixedprice-scotland/
  ├── frontend/
  ├── backend/
  ├── docs/
  └── README.md
  ```
- [ ] Add .gitignore files (Node.js, Python)
- [ ] Create initial README with project description

### Step 1.2: Supabase Setup
- [ ] Create Supabase account (https://supabase.com)
- [ ] Create new project
- [ ] Save project URL and anon key
- [ ] Note database password
- [ ] Set up local Supabase CLI (optional)

### Step 1.3: Environment Setup
- [ ] Create `.env.example` files:
  - `frontend/.env.example`
  - `backend/.env.example`
- [ ] Document required environment variables

### Step 1.4: OpenAI Account Setup
- [ ] Create OpenAI account
- [ ] Generate API key
- [ ] Add credits/billing setup
- [ ] Test API access

### Step 1.5: Stripe Account Setup
- [ ] Create Stripe account (https://stripe.com)
- [ ] Get API keys (test and live)
- [ ] Set up webhook endpoint (note URL for later)
- [ ] Configure payment methods (card, etc.)
- [ ] Set up products and prices:
  - Buyer Monthly Subscription (£5-10/month)
  - Buyer Yearly Subscription (discounted)
  - Agent Verification Badge (one-time or monthly)

---

## Phase 2: Database Schema Design (Days 2-3)

### Step 2.1: Design Database Schema
- [ ] Create tables structure in Supabase SQL Editor:

**Tables needed:**
- `listings` (main property listings)
- `classifications` (AI classification results)
- `postcode_stats` (historical sale data)
- `agents` (estate agent info, optional)
- `sync_logs` (tracking data ingestion)
- `user_profiles` (extended user data)
- `subscriptions` (user subscription plans)
- `payments` (payment transactions)
- `user_saved_searches` (saved searches for subscribers)

### Step 2.2: Create Tables in Supabase

**Listings Table:**
```sql
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_url TEXT NOT NULL,
  source TEXT NOT NULL, -- 'rightmove', 'zoopla', 'espc', 'agent'
  address TEXT NOT NULL,
  postcode TEXT,
  city TEXT,
  region TEXT,
  price_raw TEXT NOT NULL, -- raw price text from listing
  price_numeric DECIMAL(10,2), -- parsed numeric price
  description TEXT,
  agent_name TEXT,
  agent_url TEXT,
  first_seen_at TIMESTAMP DEFAULT NOW(),
  last_checked_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Classifications Table:**
```sql
CREATE TABLE classifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  status TEXT NOT NULL, -- 'explicit', 'likely', 'competitive'
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  classification_reason TEXT,
  ai_model_used TEXT,
  classified_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Postcode Stats Table:**
```sql
CREATE TABLE postcode_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  postcode TEXT NOT NULL UNIQUE,
  avg_sale_over_asking DECIMAL(5,2), -- percentage
  total_sales INTEGER DEFAULT 0,
  fixed_price_friendliness TEXT, -- 'high', 'medium', 'low'
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Sync Logs Table:**
```sql
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL,
  status TEXT NOT NULL, -- 'success', 'failed', 'partial'
  listings_found INTEGER DEFAULT 0,
  listings_added INTEGER DEFAULT 0,
  listings_updated INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Step 2.3: Create Indexes
- [ ] Add indexes for performance:
  ```sql
  CREATE INDEX idx_listings_postcode ON listings(postcode);
  CREATE INDEX idx_listings_source ON listings(source);
  CREATE INDEX idx_listings_price ON listings(price_numeric);
  CREATE INDEX idx_listings_active ON listings(is_active);
  CREATE INDEX idx_classifications_listing_id ON classifications(listing_id);
  CREATE INDEX idx_classifications_status ON classifications(status);
  ```

**User Profiles Table:**
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'buyer', -- 'buyer', 'seller', 'agent', 'admin'
  phone TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Subscriptions Table:**
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  plan_type TEXT NOT NULL, -- 'buyer_monthly', 'buyer_yearly', 'agent_verification'
  status TEXT NOT NULL, -- 'active', 'canceled', 'past_due', 'trialing'
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Payments Table:**
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'gbp',
  status TEXT NOT NULL, -- 'succeeded', 'pending', 'failed', 'refunded'
  payment_method TEXT, -- 'card', 'bank_transfer', etc.
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Agents Table (Extended):**
```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  license_number TEXT,
  website_url TEXT,
  phone TEXT,
  email TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_badge_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**User Saved Searches Table:**
```sql
CREATE TABLE user_saved_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- user-given name for the search
  max_budget DECIMAL(10,2),
  postcode TEXT,
  city TEXT,
  region TEXT,
  confidence_level TEXT, -- 'explicit', 'explicit_and_likely'
  is_active BOOLEAN DEFAULT TRUE,
  last_notified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Step 2.4: Set Up Row Level Security (RLS)
- [ ] Enable RLS on all tables
- [ ] Create policies for public read access:
  ```sql
  -- Public can read active listings (browsing)
  CREATE POLICY "Public listings are viewable by everyone"
    ON listings FOR SELECT
    USING (is_active = TRUE);
  
  -- Public can read classifications
  CREATE POLICY "Classifications are viewable by everyone"
    ON classifications FOR SELECT
    USING (TRUE);
  
  -- Users can read their own profile
  CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);
  
  -- Users can update their own profile
  CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);
  
  -- Users can view their own subscriptions
  CREATE POLICY "Users can view own subscriptions"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);
  
  -- Users can view their own payments
  CREATE POLICY "Users can view own payments"
    ON payments FOR SELECT
    USING (auth.uid() = user_id);
  
  -- Users can manage their own saved searches
  CREATE POLICY "Users can manage own saved searches"
    ON user_saved_searches FOR ALL
    USING (auth.uid() = user_id);
  
  -- Only admins can manage listings (for now)
  CREATE POLICY "Admins can manage listings"
    ON listings FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
  ```
- [ ] Test RLS policies

### Step 2.5: User Roles & Permissions System

**User Roles Defined:**
- **Public (Unauthenticated):** Browse listings, view details, basic filters (no account required for browsing, accounts optional for alerts later)
- **Buyer:** All public features + saved searches, email alerts (requires subscription)
- **Seller:** Can submit listings (free), view own listings
- **Agent:** Can manage listings, paid verification badge
- **Admin:** Full system access, manage users, classifications, sync data

**Subscription Plans:**
- **Free:** Browse only, no saved searches
- **Buyer Monthly:** £5-10/month - Full access, saved searches, email alerts
- **Buyer Yearly:** Discounted rate - Same as monthly
- **Agent Verification:** One-time or monthly fee - Verification badge

**Feature Access Matrix:**
| Feature | Public | Free User | Subscriber | Agent | Admin |
|---------|--------|-----------|------------|-------|-------|
| Browse listings | ✅ | ✅ | ✅ | ✅ | ✅ |
| View details | ✅ | ✅ | ✅ | ✅ | ✅ |
| Saved searches | ❌ | ❌ | ✅ | ✅ | ✅ |
| Email alerts | ❌ | ❌ | ✅ | ✅ | ✅ |
| Submit listing | ❌ | ✅ | ✅ | ✅ | ✅ |
| Verification badge | ❌ | ❌ | ❌ | ✅ (paid) | ✅ |
| Manage all listings | ❌ | ❌ | ❌ | ❌ | ✅ |
| Classify listings | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Phase 3: Backend Development (Days 3-7)

### Step 3.1: Initialize FastAPI Project
- [ ] Create `backend/` directory
- [ ] Set up Python virtual environment
- [ ] Create `requirements.txt`:
  ```
  fastapi==0.104.1
  uvicorn[standard]==0.24.0
  python-dotenv==1.0.0
  supabase==2.0.0
  openai==1.3.0
  httpx==0.25.0
  pydantic==2.5.0
  pydantic-settings==2.1.0
  stripe==7.0.0
  python-jose[cryptography]==3.3.0
  passlib[bcrypt]==1.7.4
  slowapi==0.1.9  # Rate limiting
  ```
- [ ] Install dependencies
- [ ] Create project structure:
  ```
  backend/
  ├── app/
  │   ├── api/v1/
  │   ├── core/
  │   ├── models/
  │   ├── services/
  │   └── utils/
  ├── main.py
  └── requirements.txt
  ```
- [ ] Create `backend/app/core/config.py`:
  - Load environment variables
  - Settings class with Pydantic BaseSettings
  - CORS origins configuration
- [ ] Create `backend/main.py` with basic FastAPI app
- [ ] Test server runs on localhost:8000

### Step 3.2: Security & Configuration Setup
- [ ] Create `backend/app/core/security.py`:
  - JWT token verification functions
  - Supabase JWT verification
  - Password hashing utilities
  - Token extraction from headers
- [ ] Create `backend/app/core/dependencies.py`:
  - Dependency for current user (from JWT)
  - Dependency for role checking
  - Dependency for subscription checking
- [ ] Configure CORS in `main.py`:
  - Allow only frontend domain (Vercel URL)
  - Allow credentials
  - Configure allowed methods and headers
- [ ] Set up rate limiting:
  - Use slowapi for rate limiting
  - Configure per-IP limits
  - Configure per-user limits
- [ ] Add security headers middleware

### Step 3.3: Database Connection Setup
- [ ] Install Supabase Python client
- [ ] Create `backend/app/core/database.py`:
  - Initialize Supabase client with service role key
  - Create helper functions for common queries
  - Handle connection errors
  - Connection pooling configuration
- [ ] Create `backend/.env.example` with all required variables
- [ ] Create `backend/.env` file with Supabase credentials
- [ ] Test database connection

### Step 3.4: Create Data Models (Pydantic)
- [ ] Create `backend/app/models/listing.py`:
  - Listing model
  - Classification model
  - Request/Response models
- [ ] Create `backend/app/models/classification.py`:
  - Classification status enum
  - Confidence score validation
  - Classification response model
- [ ] Create `backend/app/models/user.py`:
  - User profile model
  - User role enum
  - Subscription model
- [ ] Create `backend/app/models/payment.py`:
  - Payment model
  - Subscription plan enum
  - Stripe webhook models

### Step 3.5: Build Classification Service
- [ ] Create `backend/app/services/classification_service.py`
- [ ] Implement OpenAI API integration:
  - Function to call OpenAI API
  - Prompt engineering for classification
  - Parse OpenAI response
  - Extract status, confidence, reason
- [ ] Test classification with sample listings

### Step 3.6: Build API Endpoints
- [ ] Create `backend/app/api/v1/listings.py`:
  - `GET /api/v1/listings` - List all fixed-price listings (public)
  - `GET /api/v1/listings/{id}` - Get single listing (public)
  - `GET /api/v1/listings/search` - Search with filters (public)
  - `POST /api/v1/listings` - Create listing (admin only, requires JWT)
  - `PUT /api/v1/listings/{id}` - Update listing (admin only, requires JWT)
  - Use dependencies for authentication
  - Input validation with Pydantic models
  - Error handling
- [ ] All API endpoints should be in `backend/app/api/v1/` directory
- [ ] Use versioned API structure for future compatibility

### Step 3.7: Subscription & Payment Services
- [ ] Create `backend/app/services/subscription_service.py`:
  - Create Stripe customer
  - Create checkout session
  - Handle subscription status updates
  - Check user subscription access
- [ ] Create `backend/app/services/payment_service.py`:
  - Process Stripe webhooks
  - Handle payment success/failure
  - Update subscription status
  - Record payment transactions
- [ ] Create `backend/app/services/stripe_service.py`:
  - Stripe API wrapper
  - Product/price management
  - Webhook signature verification

### Step 3.8: Data Ingestion Service
- [ ] Create `backend/app/services/ingestion_service.py`:
  - Manual listing entry function
  - URL validation
  - Duplicate detection
  - Price parsing utility
- [ ] Create placeholder for automated ingestion:
  - Structure for future API integrations
  - Manual curation workflow

### Step 3.9: Postcode Stats Service (Wasted Viewings Eliminator)
- [ ] Create `backend/app/services/postcode_service.py`:
  - Calculate success probability based on:
    - Whether asking price ≤ user budget
    - Historical sale behavior in postcode (average % over asking)
  - Store/update postcode stats
  - Simple heuristic logic (MVP, no ML required)
  - **Exclusion Rule:** Exclude listings where similar homes in same postcode historically sell >10% above asking price
- [ ] Implement success probability calculation:
  - **High chance:** Postcode avg sale is ≤5% over asking
  - **Medium chance:** Postcode avg sale is 5-10% over asking
  - **Low chance:** Postcode avg sale is >10% over asking (should be excluded from results)
- [ ] Add success probability to listing response

---

## Phase 4: Frontend Development (Days 7-12)

### Step 4.1: Initialize Next.js Project
- [ ] Create `frontend/` directory
- [ ] Initialize Next.js 14+ with TypeScript:
  ```bash
  npx create-next-app@latest frontend --typescript --tailwind --app
  ```
- [ ] Install additional dependencies:
  - `@supabase/supabase-js`
  - `@supabase/auth-helpers-nextjs`
  - `axios` or `fetch` for API calls
  - `react-hook-form`
  - `zod`
  - `leaflet` or `mapbox-gl`
  - `@radix-ui/react-*` or `shadcn/ui`
  - `@stripe/stripe-js` (Stripe frontend)
  - `@stripe/react-stripe-js` (Stripe React components)
  - **If using Option A (Next.js API Routes):**
    - `openai` (Node.js SDK)
    - `stripe` (Node.js SDK)
    - `@supabase/supabase-js` (for server-side)
- [ ] Set up project structure:
  ```
  frontend/
  ├── app/
  │   ├── layout.tsx
  │   ├── page.tsx
  │   └── (routes)/
  ├── components/
  ├── lib/
  └── public/
  ```

### Step 4.2: Environment & Configuration
- [ ] Create `frontend/.env.local.example` with all required variables
- [ ] Create `frontend/.env.local` with:
  - `NEXT_PUBLIC_API_URL` (backend URL: http://localhost:8000 for local, production URL for prod)
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] Set up API client utility (`lib/api/client.ts`):
  - Base URL configuration
  - Request interceptors for JWT token
  - Response error handling
  - Retry logic for failed requests
- [ ] Set up Supabase client (`lib/supabase.ts`):
  - Client-side Supabase client (uses anon key)
  - Auth helpers
- [ ] Set up Stripe client (`lib/stripe.ts`):
  - Stripe publishable key initialization
  - Checkout integration
- [ ] Create authentication context (`contexts/AuthContext.tsx`):
  - User state management
  - Auth token management
  - Login/logout functions

### Step 4.3: Design System Setup
- [ ] Configure Tailwind CSS
- [ ] Set up shadcn/ui or Radix UI components
- [ ] Create color scheme (brand colors)
- [ ] Create typography system
- [ ] Create reusable button, card, badge components

### Step 4.4: Authentication Pages
- [ ] Create login page (`app/login/page.tsx`)
- [ ] Create signup page (`app/signup/page.tsx`)
- [ ] Create password reset page
- [ ] Implement Supabase Auth:
  - Email/password authentication
  - OAuth providers (optional: Google, etc.)
  - Session management
- [ ] Create protected route middleware
- [ ] Add authentication state management
- [ ] Create user profile dropdown in header

### Step 4.5: Homepage & Layout
- [ ] Create main layout component
- [ ] Build homepage with:
  - Hero section (value proposition)
  - Filter section
  - How it works section
  - Pricing section (subscription plans)
- [ ] Add navigation header (with login/signup buttons)
- [ ] Add footer with disclaimers
- [ ] Make responsive (mobile-first)

### Step 4.6: Subscription & Payment Pages
- [ ] Create pricing page (`app/pricing/page.tsx`):
  - Display subscription plans
  - Feature comparison
  - "Subscribe" buttons
- [ ] Create checkout page (`app/checkout/page.tsx`):
  - Stripe Checkout integration
  - Payment form
  - Success/error handling
- [ ] Create subscription management page (`app/account/subscription/page.tsx`):
  - Current subscription status
  - Cancel subscription option
  - Payment history
  - Update payment method
- [ ] Create account dashboard (`app/account/page.tsx`):
  - User profile
  - Subscription status
  - Saved searches (for subscribers)
- [ ] Implement subscription-gated features:
  - Saved searches (CRUD operations)
  - Email alerts
  - Advanced filters
- [ ] Create saved searches page (`app/account/saved-searches/page.tsx`):
  - List all saved searches
  - Create new saved search from current filters
  - Edit/delete saved searches
  - Enable/disable search alerts
- [ ] Add subscription check middleware for protected features
- [ ] Show "Upgrade to unlock" prompts for free users

### Step 4.7: Listings List View
- [ ] Create listings page (`app/listings/page.tsx`)
- [ ] Build `ListingCard` component:
  - Price display
  - Address
  - Confidence badge (Explicit/Likely/Competitive)
  - Short explanation ("Why this is fixed price" - uses classification_reason)
  - Link to original listing (always link back to source)
  - Success probability indicator ("High/Medium/Low chance of securing at asking price")
- [ ] Implement filtering:
  - Max budget filter (£)
  - Area filter (postcode / city / region)
  - Fixed price only toggle (default ON - only show Explicit and Likely, exclude Competitive)
  - Classification confidence filter (Explicit only vs Explicit + Likely)
- [ ] Add sorting options
- [ ] Add pagination or infinite scroll
- [ ] Connect to backend API

### Step 4.8: Map View
- [ ] Install map library (Leaflet or Mapbox)
- [ ] Create map component
- [ ] Display listings as markers
- [ ] Show popup on marker click
- [ ] Add map controls
- [ ] Toggle between list and map view
- [ ] Make map responsive

### Step 4.9: Filter Components
- [ ] Create `BudgetFilter` component
- [ ] Create `AreaFilter` component (postcode/city input)
- [ ] Create `ConfidenceFilter` component:
  - "Explicit only" option
  - "Explicit + Likely" option (default)
- [ ] Ensure "Fixed price only" filter is ON by default (excludes Competitive listings)
- [ ] Add filter state management
- [ ] Persist filters in URL params (optional)

### Step 4.10: Listing Details Page
- [ ] Create `app/listings/[id]/page.tsx`
- [ ] Display full listing information:
  - All listing details
  - Classification details
  - Success probability
  - Original listing link
- [ ] Add "Back to listings" navigation

### Step 4.11: Error Handling & Loading States
- [ ] Add loading spinners
- [ ] Create error boundary components
- [ ] Add "No listings found" state
- [ ] Add empty state illustrations
- [ ] Handle API errors gracefully

---

## Phase 5: AI Classification Integration (Days 12-14)

### Step 5.1: Classification Prompt Engineering
- [ ] Refine OpenAI prompt in `classification_service.py`
- [ ] Include classification patterns in prompt:
  - **Fixed Price (Explicit):**
    - "Fixed Price £X"
    - "£X" with no offers language
    - Clear fixed price indicators
  - **Fixed Price Likely:**
    - "Offers Over £X (Fixed Price Considered)"
    - "Seller willing to accept fixed price"
    - Ambiguous but buyer-friendly language
  - **Competitive Bidding:**
    - "Closing date set"
    - "Offers invited"
    - "Highly sought after"
    - "Expected to exceed"
    - Any competitive bidding language
- [ ] Test with various listing examples covering all three categories
- [ ] Fine-tune prompt for accuracy
- [ ] Document prompt strategy and examples used

### Step 5.2: Classification Workflow
- [ ] Create manual classification trigger (admin)
- [ ] Build batch classification endpoint
- [ ] Add classification queue system (simple)
- [ ] Handle rate limiting
- [ ] Add retry logic for failed classifications

### Step 5.3: Confidence Score Calibration
- [ ] Test confidence scores with real data
- [ ] Adjust scoring logic if needed
- [ ] Document confidence thresholds

---

## Phase 6: Data Ingestion & Manual Entry (Days 14-16)

### Step 6.1: Manual Listing Entry
- [ ] Create admin interface (or API endpoint) for:
  - Adding listing URL
  - Entering listing details
  - Triggering classification
- [ ] Validate listing data
- [ ] Check for duplicates

### Step 6.2: Data Sources Research & Ingestion Methods
- [ ] Research API access for:
  - ESPC
  - Rightmove
  - Zoopla
  - Agent websites
- [ ] Document available APIs/feeds
- [ ] **Ingestion Methods (No Scraping):**
  - Use metadata where available
  - Use official feeds/APIs
  - Manual curation (MVP primary method)
  - Permitted APIs only
  - **No scraping** of protected content or behind logins
  - **No scraping** of ToS-restricted content
- [ ] Plan integration approach (MVP: manual curation, future: automated feeds)
- [ ] Ensure all listings link back to original source

### Step 6.3: Initial Data Population
- [ ] Manually enter 20-50 sample listings
- [ ] Run classification on all listings
- [ ] Verify classification results
- [ ] Fix any data quality issues

### Step 6.4: Postcode Stats Initialization
- [ ] Research historical sale data sources
- [ ] Manually add sample postcode stats (MVP)
- [ ] Calculate initial success probabilities

---

## Phase 7: Testing & Refinement (Days 16-18)

### Step 7.1: Backend Testing
- [ ] Test all API endpoints
- [ ] Test error cases
- [ ] Test classification accuracy
- [ ] Test authentication & authorization:
  - User roles (buyer, seller, agent, admin)
  - Protected routes
  - Subscription checks
- [ ] Test payment webhooks:
  - Stripe webhook signature verification
  - Subscription creation
  - Payment success/failure
  - Subscription cancellation
- [ ] Performance testing (response times)
- [ ] Fix bugs

### Step 7.2: Frontend Testing
- [ ] Test all pages and components
- [ ] Test authentication flows:
  - Signup/login
  - Password reset
  - Session management
- [ ] Test subscription flows:
  - Checkout process
  - Stripe payment integration
  - Subscription status display
  - Cancellation flow
- [ ] Test role-based access:
  - Public vs subscriber features
  - Admin-only features
- [ ] Test filtering functionality
- [ ] Test responsive design (mobile/tablet/desktop)
- [ ] Test browser compatibility
- [ ] Fix UI/UX issues

### Step 7.3: Integration Testing
- [ ] Test full user flow:
  - Browse listings (public)
  - Sign up / login
  - Subscribe to plan
  - Access subscriber features (saved searches)
  - Apply filters
  - View map
  - Click through to original listing
- [ ] Test subscription flow:
  - Select plan
  - Complete checkout
  - Verify subscription activation
  - Test cancellation
- [ ] Test admin workflow:
  - Login as admin
  - Add new listing
  - Trigger classification
  - Manage users
- [ ] Test classification workflow
- [ ] Verify data accuracy

### Step 7.4: Content & Copy
- [ ] Review all text content
- [ ] Add disclaimers where needed
- [ ] Ensure legal compliance statements
- [ ] Polish UI copy

---

## Phase 8: Deployment (Days 18-21)

### Step 8.1: Supabase Production Setup
- [ ] Review database schema in production
- [ ] Verify RLS policies
- [ ] Test database connection
- [ ] Set up backups (Supabase handles this)

### Step 8.2: AWS Account & EC2 Setup
- [ ] Create AWS account (if not already)
- [ ] Set up billing alerts ($1 threshold)
- [ ] Create IAM user for deployment (with EC2 permissions)
- [ ] Configure AWS CLI locally (optional)
- [ ] Launch EC2 instance:
  - **AMI:** Ubuntu Server 22.04 LTS (free tier eligible)
  - **Instance Type:** t2.micro (free tier eligible)
  - **Security Group:** Allow SSH (22), HTTP (80), HTTPS (443), Custom TCP (8000)
  - **Key Pair:** Create and download .pem file
  - **Storage:** 8 GB (free tier eligible)
- [ ] Allocate Elastic IP (optional but recommended)
- [ ] Associate Elastic IP with instance
- [ ] **See `aws-setup-guide.md` for detailed EC2 setup instructions**

### Step 8.3: Server Setup (SSH into EC2)
- [ ] Connect to EC2 instance via SSH
- [ ] Update system: `sudo apt update && sudo apt upgrade -y`
- [ ] Install required software:
  - Node.js 20.x
  - Python 3.11
  - Nginx
  - PM2
  - Git
  - Certbot (for SSL)
- [ ] Configure firewall (UFW):
  - Allow SSH, HTTP, HTTPS, port 8000
- [ ] Clone repository from GitHub
- [ ] **See `aws-setup-guide.md` Step 3-4 for detailed server setup**

### Step 8.4: Backend Deployment (AWS EC2)
- [ ] Navigate to `backend/` directory
- [ ] Create Python virtual environment: `python3.11 -m venv venv`
- [ ] Activate venv: `source venv/bin/activate`
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Create `.env` file with production variables:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENAI_API_KEY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `JWT_SECRET`
  - `CORS_ORIGINS` (http://your-ec2-ip,https://yourdomain.com)
  - `ENVIRONMENT=production`
  - `PORT=8000`
- [ ] Test backend: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- [ ] Create systemd service file (`/etc/systemd/system/fixedprice-backend.service`)
- [ ] Enable and start service: `sudo systemctl enable fixedprice-backend && sudo systemctl start fixedprice-backend`
- [ ] Verify health check: `curl http://localhost:8000/api/v1/health`
- [ ] Configure Stripe webhook endpoint:
  - Set webhook URL in Stripe dashboard: `https://yourdomain.com/api/v1/webhooks/stripe` or `https://your-ec2-ip:8443/api/v1/webhooks/stripe`
  - Configure events to listen to:
    - `checkout.session.completed`
    - `customer.subscription.created`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
    - `payment_intent.succeeded`
    - `payment_intent.payment_failed`
- [ ] Test production API endpoints
- [ ] Test Stripe webhook in production

### Step 8.5: Frontend Deployment (AWS EC2)
- [ ] Navigate to `frontend/` directory on EC2
- [ ] Install dependencies: `npm install`
- [ ] Create `.env.local` file with production variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `NEXT_PUBLIC_API_URL` (http://your-ec2-ip:8000/api/v1 or https://api.yourdomain.com/api/v1)
- [ ] Build Next.js app: `npm run build`
- [ ] Start with PM2: `pm2 start npm --name "fixedprice-frontend" -- start`
- [ ] Save PM2 configuration: `pm2 save`
- [ ] Setup PM2 startup: `pm2 startup` (follow instructions)
- [ ] Test frontend: `curl http://localhost:3000`
- [ ] Verify frontend-backend communication

### Step 8.6: Nginx Configuration
- [ ] Create Nginx configuration file: `/etc/nginx/sites-available/fixedprice-scotland`
- [ ] Configure reverse proxy for frontend (port 3000 → 80/443)
- [ ] Configure reverse proxy for backend (port 8000 → 8000/8443)
- [ ] Enable site: `sudo ln -s /etc/nginx/sites-available/fixedprice-scotland /etc/nginx/sites-enabled/`
- [ ] Remove default site: `sudo rm /etc/nginx/sites-enabled/default`
- [ ] Test Nginx config: `sudo nginx -t`
- [ ] Restart Nginx: `sudo systemctl restart nginx`
- [ ] Verify both frontend and backend are accessible via Nginx

### Step 8.7: SSL Certificate Setup (Let's Encrypt)
- [ ] Install Certbot: `sudo apt install certbot python3-certbot-nginx`
- [ ] Get SSL certificate: `sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com`
- [ ] Certbot will automatically configure HTTPS
- [ ] Update Nginx config for HTTPS if needed
- [ ] Test SSL: Visit `https://yourdomain.com`
- [ ] Verify auto-renewal: `sudo certbot renew --dry-run`
- [ ] Update environment variables to use HTTPS URLs

### Step 8.8: Domain Configuration (Optional)
- [ ] **Option 1: AWS Route 53**
  - Register or transfer domain to Route 53
  - Create hosted zone
  - Create A record pointing to Elastic IP
  - Create CNAME for www subdomain
  - Create A record for api subdomain
- [ ] **Option 2: External DNS Provider**
  - Add A record pointing to Elastic IP
  - Add CNAME for www
  - Add A record for api subdomain
- [ ] Update environment variables with domain URLs
- [ ] Update CORS_ORIGINS in backend `.env`
- [ ] Restart services if needed

### Step 8.4: Post-Deployment Checks
- [ ] Test full production workflow
- [ ] Verify all links work
- [ ] Check API rate limits
- [ ] Monitor error logs
- [ ] Test on mobile devices
- [ ] Verify SEO basics

### Step 8.11: Documentation & Monitoring Setup
- [ ] Update README with:
  - Setup instructions
  - Environment variables
  - API documentation
  - AWS deployment process
- [ ] Document classification logic
- [ ] Add code comments where needed
- [ ] Setup log monitoring:
  - Backend logs: `sudo journalctl -u fixedprice-backend -f`
  - Frontend logs: `pm2 logs fixedprice-frontend`
  - Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- [ ] Setup AWS CloudWatch (optional):
  - Install CloudWatch agent
  - Monitor EC2 instance metrics
  - Set up alerts
- [ ] Document update process:
  - How to pull latest code
  - How to restart services
  - How to update dependencies

---

## Alternative: Option A - Next.js API Routes Implementation

**If choosing to use Next.js API Routes instead of separate FastAPI backend:**

### Step A.1: Create API Routes Structure
- [ ] Create `frontend/app/api/listings/route.ts`:
  - `GET /api/listings` - List all fixed-price listings
  - `POST /api/listings` - Create listing (admin)
- [ ] Create `frontend/app/api/classify/route.ts`:
  - `POST /api/classify` - Classify a listing
- [ ] Create `frontend/app/api/subscriptions/route.ts`:
  - `POST /api/subscriptions/create-checkout` - Stripe checkout
  - `POST /api/subscriptions/cancel` - Cancel subscription
- [ ] Create `frontend/app/api/webhooks/stripe/route.ts`:
  - `POST /api/webhooks/stripe` - Stripe webhook handler
- [ ] Create `frontend/app/api/saved-searches/route.ts`:
  - CRUD operations for saved searches

### Step A.2: Install Server-Side Dependencies
- [ ] Install OpenAI Node.js SDK: `npm install openai`
- [ ] Install Stripe Node.js SDK: `npm install stripe`
- [ ] Use Supabase server client (not public client) in API routes

### Step A.3: Implement Services
- [ ] Create `frontend/lib/services/classification.ts`:
  - OpenAI API integration
  - Classification logic
- [ ] Create `frontend/lib/services/subscription.ts`:
  - Stripe integration
  - Subscription management
- [ ] Create `frontend/lib/services/postcode.ts`:
  - Success probability calculation

### Step A.4: Environment Variables
- [ ] Add to `.env.local`:
  - `OPENAI_API_KEY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `SUPABASE_SERVICE_ROLE_KEY` (for server-side operations)

### Benefits
- Single deployment (Vercel)
- No separate backend server
- Simpler architecture
- Faster development

---

## Phase 9: MVP Launch Preparation (Days 21+)

### Step 9.1: Data Quality
- [ ] Ensure minimum 50+ listings
- [ ] Verify classifications are accurate
- [ ] Check all listing links work
- [ ] Validate postcode data

### Step 9.2: Legal & Compliance
- [ ] Add privacy policy
- [ ] Add terms of service
- [ ] Add disclaimers about classification:
  - "Classification is indicative, not guaranteed"
  - Position product as filtering/discovery tool, not a property portal
- [ ] Ensure all external links work (link back to original listings)
- [ ] Verify no ToS violations:
  - No scraping behind logins
  - No scraping of ToS-restricted content
  - Use metadata, feeds, manual curation, or permitted APIs only
- [ ] Use confidence scores, not guarantees
- [ ] Ensure no protected content scraping

### Step 9.3: Success Criteria Validation (MVP)
- [ ] Verify user can find fixed-price properties in Scotland that don't appear via portal filters
- [ ] Verify classification accuracy is explainable and consistent
- [ ] Verify app demonstrably reduces wasted viewings (success probability feature working)
- [ ] Verify clear differentiation from Rightmove/Zoopla
- [ ] Test fast filtering (sub-second response)
- [ ] Verify mobile-first responsive UI works on all devices
- [ ] Confirm all listings link back to original sources

### Step 9.4: Launch Checklist
- [ ] Final testing pass
- [ ] Performance optimization
- [ ] Analytics setup (optional)
- [ ] Error tracking (Sentry) setup
- [ ] Prepare launch announcement
- [ ] Beta test with 5-10 users
- [ ] Collect feedback
- [ ] Make final adjustments

---

## Post-MVP Enhancements (Future)

- [ ] Automated listing ingestion
- [ ] Email alerts for new listings
- [ ] Price change tracking
- [ ] User accounts (optional)
- [ ] Saved searches
- [ ] Estate agent verification
- [ ] Postcode heatmaps
- [ ] Advanced analytics dashboard

---

## Key Milestones

- **Day 3:** Database schema complete
- **Day 7:** Backend API functional
- **Day 12:** Frontend MVP complete
- **Day 16:** AI classification working
- **Day 18:** Initial data populated
- **Day 21:** Deployed to production
- **Day 23:** MVP launch ready

---

## Notes

- Start with manual data entry, automate later
- Focus on classification accuracy over speed
- Prioritize user experience in filtering
- Keep MVP scope tight
- Iterate based on user feedback
