# FixedPrice Scotland

FixedPrice Scotland is a platform dedicated to identifying and listing **Fixed Price** property listings in Scotland, helping buyers find homes with predictable pricing in a traditionally competitive **Offers Over** market.

---

## Table of Contents

- [Why FixedPrice Scotland?](#why-fixedprice-scotland)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Data Sources & Portals](#data-sources--portals)
- [Testing](#testing)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [License](#license)

---

## Why FixedPrice Scotland?

In the Scottish property market, most listings are **Offers Over**, which leads to bidding wars, sealed bids, and uncertainty. FixedPrice Scotland uses **AI classification** to identify listings that are explicitly fixed price or highly likely to be buyer-friendly, so you can focus on homes you can actually buy at the advertised price.

**Value proposition:** Portal filters show you properties you can't afford (Offers Over). FixedPrice Scotland shows you the ones you **actually can** buy.

---

## Features

### For Buyers
- **Search listings** by location (city, postcode), max budget, and confidence level (Explicit / Likely fixed price)
- **Saved searches** with email alerts when new matching listings appear
- **Map view** (Leaflet / Google Maps) of properties
- **Account** – profile, subscription, saved searches management
- **Pricing & subscription** – free tier plus paid plans (Stripe / bank transfer invoicing)

### For Admins & Agents
- **Admin dashboard** – users, listings, subscriptions, analytics
- **Listings management** – create, edit, approve listings; bulk operations
- **Manual ingestion** – add listings from Rightmove, Zoopla, ESPC, OnTheMarket, S1homes, or agent sites via API
- **Zoopla sync** (when Hometrack access is granted) – bulk pull listings from Zoopla API
- **AI classification** – OpenAI GPT-4 classifies each listing as fixed price (explicit/likely/unlikely) and explains why
- **User management** – view users, change roles (admin, agent, buyer)
- **Ingestion stats** – listings by source, classification breakdown

### Technical
- **Auth** – Supabase Auth (email, Google OAuth, password reset)
- **Roles** – `admin`, `agent`, `buyer` with role-based access control
- **Rate limiting** – SlowAPI on sensitive endpoints
- **Email** – welcome, subscription, search alerts, invoices (Jinja2 templates)
- **No scraping** – manual curation + official APIs/feeds only. Docs available on request.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Radix UI, React Hook Form, Zod, Leaflet, Stripe |
| **Backend** | Python 3.11+, FastAPI, Uvicorn |
| **Database** | Supabase (PostgreSQL, Auth, Storage) |
| **AI** | OpenAI GPT-4 (listing classification) |
| **Payments** | Stripe (optional); bank transfer invoicing |
| **Email** | FastAPI-Mail (SMTP, e.g. Gmail) |
| **Deployment** | AWS EC2, Nginx, PM2 (frontend), systemd (backend) |

---

## Project Structure

```
fixedprice-scotland/
├── frontend/                 # Next.js app (src/app router)
│   ├── src/
│   │   ├── app/              # Pages: home, listings, account, admin, auth, etc.
│   │   ├── components/       # UI, filters, listings, layout
│   │   ├── contexts/         # AuthContext
│   │   ├── hooks/            # useDebounce, etc.
│   │   └── lib/              # API client, Supabase, Stripe
│   └── package.json
├── backend/                  # FastAPI app
│   ├── app/
│   │   ├── api/v1/           # listings, users, subscriptions, ingestion, zoopla, admin, etc.
│   │   ├── core/             # config, database, security, error handlers
│   │   ├── models/           # Pydantic models
│   │   ├── services/         # ingestion, classification, email, stripe, zoopla
│   │   └── templates/email/  # Jinja2 email templates
│   ├── main.py               # FastAPI app entry
│   ├── requirements.txt
│   └── .env.example
├── tests/                    # Test suite
│   ├── test_api/             # Pytest API tests
│   ├── frontend/             # Jest frontend tests
│   ├── scripts/              # create-test-users, create-test-listings
│   └── ...
├── pyrightconfig.json
└── README.md
```

**Note:** Supabase is used as a remote service (configured via env vars). Documentation (migrations, setup, deployment) is available on request.

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **Python** 3.11+
- **Supabase** account
- **OpenAI** API key

### 1. Clone and install

```bash
git clone <repo-url>
cd fixedprice-scotland
```

### 2. Backend setup

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env with Supabase, OpenAI, email, etc.
```

### 3. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with Supabase URL/key, API URL, Google Maps key
```

### 4. Run locally

**Backend** (required for frontend to load account/listings):

```bash
cd backend
.\venv\Scripts\activate   # or source venv/bin/activate
python main.py
```

- API: [http://localhost:8000](http://localhost:8000)
- Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health: [http://localhost:8000/health](http://localhost:8000/health)

**Frontend** (in another terminal):

```bash
cd frontend
npm run dev
```

- App: [http://localhost:3000](http://localhost:3000)

If you see **Backend unreachable** or **Network Error**, start the backend first. The frontend uses `NEXT_PUBLIC_API_URL` (default: same-origin `/api/v1` when proxied; or `http://localhost:8000` for dev).

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | For admin operations |
| `SUPABASE_JWT_SECRET` | Yes* | JWT secret (Supabase Settings → API) |
| `SUPABASE_DB_PASSWORD` | Yes* | If using direct DB connection |
| `OPENAI_API_KEY` | Yes | For AI classification |
| `JWT_SECRET` | Yes* | For token validation (or use JWKS) |
| `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM` | Yes | SMTP for emails |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | No | For Stripe payments |
| `ZOOPLA_CLIENT_ID`, `ZOOPLA_CLIENT_SECRET`, `ZOOPLA_ENABLED` | No | Zoopla API (Hometrack agreement) |

\* See [backend/.env.example](backend/.env.example) for details. Full docs available on request.

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `NEXT_PUBLIC_API_URL` | No* | Backend API base (e.g. `http://localhost:8000` for dev). Omit in production if Nginx proxies `/api` and `/health` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Yes | For map features |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | No | For Stripe checkout |
| `NEXT_PUBLIC_APP_URL` | No | OAuth redirect base (e.g. production URL) |
| `NEXT_PUBLIC_FORCE_HTTP` | No | Redirect HTTPS→HTTP when using self-signed cert |

\* When served over HTTPS via Nginx, the frontend uses same-origin `/api/v1` and `/health` so Nginx can proxy to the backend. Nginx config available on request.

---

## API Overview

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `GET /api/v1/listings` | List listings (filters: city, postcode, max_price, confidence) |
| `GET /api/v1/public/listings` | Same as above, no auth |
| `POST /api/v1/users/me` | Current user profile |
| `GET /api/v1/users/saved-searches` | User's saved searches |
| `POST /api/v1/ingestion/manual` | Add listing manually (admin/agent) |
| `POST /api/v1/zoopla/sync` | Sync from Zoopla (admin, when enabled) |
| `GET /api/v1/admin/*` | Admin endpoints (users, analytics, etc.) |
| `POST /api/v1/webhooks/stripe` | Stripe webhook handler |

Full API docs: [http://localhost:8000/docs](http://localhost:8000/docs) when backend is running.

---

## Data Sources & Portals

Listings come from:

- **Manual ingestion** – Rightmove, Zoopla, ESPC, OnTheMarket, S1homes, agent sites (Rettie, Ferhome, KW Scotland, etc.)
- **Zoopla API** – when Hometrack commercial access is granted

**No scraping.** Portal connections and ingestion policy docs available on request.

---

## Testing

**Backend (pytest):**

```bash
cd backend
pytest tests/test_api/ -v
```

**Frontend (Jest):**

```bash
cd frontend
npm test
```

See [tests/README.md](tests/README.md), [tests/SETUP.md](tests/SETUP.md), and [tests/TEST-SUITE-SUMMARY.md](tests/TEST-SUITE-SUMMARY.md) for setup and test data.

---

## Deployment

AWS EC2 deployment guide (Nginx, PM2, systemd, SSL) and Nginx config are **available on request**.

---

## Documentation

All documentation (setup guides, AWS deployment, portal connections, migrations, Nginx config, etc.) is **available on request**. Contact the project maintainer.

---

## License

MIT

# GCreators Project Structure

This document outlines the complete project structure for the GCreators platform.

---

## Repository Structure

```
gcreators/
├── backend/                    # Python FastAPI Backend
├── frontend/                   # Next.js Frontend
├── infrastructure/             # IaC and deployment configs
├── docs/                       # Documentation
├── scripts/                    # Utility scripts
├── docker-compose.yml         # Local development
└── README.md
```

---

## Backend Structure (Python FastAPI)

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                         # FastAPI application entry point
│   ├── config.py                       # Configuration management
│   ├── database.py                     # Database connection & session
│   │
│   ├── api/                            # API routes
│   │   ├── __init__.py
│   │   ├── deps.py                     # Common dependencies (auth, db session)
│   │   └── v1/                         # API version 1
│   │       ├── __init__.py
│   │       ├── auth.py                 # POST /auth/register, /auth/login
│   │       ├── users.py                # GET/PUT /users/{id}
│   │       ├── mentors.py              # GET /mentors, GET /mentors/{id}
│   │       ├── learners.py             # GET /learners/{id}
│   │       ├── products.py             # CRUD for digital products
│   │       ├── consultations.py        # Booking management
│   │       ├── payments.py             # Stripe integration
│   │       ├── ai_matching.py          # POST /ai/match-mentors
│   │       ├── ai_chat.py              # POST /ai/chat (AI Twin)
│   │       ├── ai_translation.py       # POST /ai/translate
│   │       └── analytics.py            # GET /analytics (mentor dashboard)
│   │
│   ├── models/                         # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── base.py                     # Base model class
│   │   ├── user.py                     # User model
│   │   ├── mentor.py                   # Mentor profile
│   │   ├── learner.py                  # Learner profile
│   │   ├── product.py                  # Digital product
│   │   ├── consultation.py             # Consultation booking
│   │   ├── transaction.py              # Payment transactions
│   │   ├── ai_conversation.py          # AI chat history
│   │   ├── ai_knowledge.py             # Mentor knowledge base
│   │   ├── ai_training_data.py         # Training data collection
│   │   └── ai_model_version.py         # Model versioning
│   │
│   ├── schemas/                        # Pydantic schemas (request/response)
│   │   ├── __init__.py
│   │   ├── user.py                     # UserCreate, UserResponse, UserUpdate
│   │   ├── mentor.py                   # MentorProfile, MentorResponse
│   │   ├── learner.py                  # LearnerProfile, LearnerGoals
│   │   ├── product.py                  # ProductCreate, ProductResponse
│   │   ├── consultation.py             # BookingCreate, BookingResponse
│   │   ├── payment.py                  # PaymentIntent, PaymentConfirm
│   │   ├── ai.py                       # AIMatchRequest, AIChatRequest
│   │   └── common.py                   # Common schemas (pagination, etc.)
│   │
│   ├── services/                       # Business logic
│   │   ├── __init__.py
│   │   ├── auth_service.py             # Authentication & authorization
│   │   ├── user_service.py             # User management
│   │   ├── mentor_service.py           # Mentor operations
│   │   ├── learner_service.py          # Learner operations
│   │   ├── product_service.py          # Product management
│   │   ├── consultation_service.py     # Booking logic
│   │   ├── payment_service.py          # Stripe integration
│   │   ├── email_service.py            # AWS SES email sending
│   │   ├── file_service.py             # S3 file upload/download
│   │   ├── ai_matching_service.py      # Mentor-learner matching
│   │   ├── ai_twin_service.py          # AI Twin conversation
│   │   ├── ai_translation_service.py   # Content translation
│   │   ├── ai_training_service.py      # Model training
│   │   └── analytics_service.py        # Analytics & reporting
│   │
│   ├── ai/                             # AI/ML modules
│   │   ├── __init__.py
│   │   ├── embeddings.py               # Text embeddings (Sentence Transformers)
│   │   ├── vector_store.py             # FAISS/pgvector wrapper
│   │   ├── rag.py                      # RAG system implementation
│   │   ├── matching_algorithm.py       # Mentor matching logic
│   │   ├── twin.py                     # AI Twin core logic
│   │   ├── training.py                 # Model fine-tuning
│   │   ├── inference.py                # Model inference
│   │   ├── prompts.py                  # Prompt templates
│   │   ├── self_learning.py            # Continuous learning pipeline
│   │   └── safety.py                   # Safety guardrails
│   │
│   ├── utils/                          # Utilities
│   │   ├── __init__.py
│   │   ├── security.py                 # Password hashing, JWT
│   │   ├── validators.py               # Input validation
│   │   ├── file_upload.py              # S3 upload helpers
│   │   ├── cache.py                    # Redis caching decorators
│   │   ├── rate_limit.py               # Rate limiting
│   │   └── aws_monitoring.py           # AWS usage monitoring
│   │
│   ├── workers/                        # Celery background tasks
│   │   ├── __init__.py
│   │   ├── celery_app.py               # Celery configuration
│   │   ├── ai_tasks.py                 # AI processing tasks
│   │   ├── email_tasks.py              # Email sending tasks
│   │   ├── file_tasks.py               # File processing tasks
│   │   ├── training_tasks.py           # Model training tasks
│   │   └── monitoring_tasks.py         # Monitoring & alerts
│   │
│   ├── middleware/                     # FastAPI middleware
│   │   ├── __init__.py
│   │   ├── logging.py                  # Request/response logging
│   │   ├── error_handler.py            # Global error handling
│   │   └── cors.py                     # CORS configuration
│   │
│   └── core/                           # Core functionality
│       ├── __init__.py
│       ├── exceptions.py               # Custom exceptions
│       ├── constants.py                # Application constants
│       └── events.py                   # Event handlers (startup/shutdown)
│
├── tests/                              # Test suite
│   ├── __init__.py
│   ├── conftest.py                     # Pytest fixtures
│   ├── test_api/
│   │   ├── test_auth.py
│   │   ├── test_mentors.py
│   │   ├── test_products.py
│   │   ├── test_consultations.py
│   │   └── test_ai.py
│   ├── test_services/
│   │   ├── test_ai_matching.py
│   │   ├── test_ai_twin.py
│   │   └── test_payment.py
│   └── test_ai/
│       ├── test_embeddings.py
│       ├── test_rag.py
│       └── test_training.py
│
├── alembic/                            # Database migrations
│   ├── versions/
│   ├── env.py
│   └── script.py.mako
│
├── scripts/                            # Utility scripts
│   ├── init_db.py                      # Initialize database
│   ├── seed_data.py                    # Seed test data
│   ├── train_model.py                  # Manual model training
│   └── backup_db.py                    # Database backup
│
├── .env.example                        # Environment variables template
├── .gitignore
├── requirements.txt                    # Python dependencies
├── requirements-dev.txt                # Development dependencies
├── pytest.ini                          # Pytest configuration
├── pyproject.toml                      # Python project metadata
├── Dockerfile                          # Docker image for backend
└── README.md
```

---

## Frontend Structure (Next.js + React)

```
frontend/
├── src/
│   ├── app/                            # Next.js App Router
│   │   ├── layout.tsx                  # Root layout
│   │   ├── page.tsx                    # Home page (landing)
│   │   ├── globals.css                 # Global styles
│   │   │
│   │   ├── (auth)/                     # Auth routes group
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx              # Auth layout
│   │   │
│   │   ├── (dashboard)/                # Dashboard routes (authenticated)
│   │   │   ├── layout.tsx              # Dashboard layout with sidebar
│   │   │   │
│   │   │   ├── mentor/                 # Mentor dashboard
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx        # Mentor overview
│   │   │   │   ├── products/
│   │   │   │   │   ├── page.tsx        # List products
│   │   │   │   │   ├── new/
│   │   │   │   │   │   └── page.tsx    # Create product
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx    # View product
│   │   │   │   │       └── edit/
│   │   │   │   │           └── page.tsx # Edit product
│   │   │   │   ├── consultations/
│   │   │   │   │   ├── page.tsx        # List bookings
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx    # Booking details
│   │   │   │   ├── ai-twin/
│   │   │   │   │   ├── page.tsx        # AI Twin management
│   │   │   │   │   ├── setup/
│   │   │   │   │   │   └── page.tsx    # Initial setup wizard
│   │   │   │   │   ├── training/
│   │   │   │   │   │   └── page.tsx    # Training data management
│   │   │   │   │   └── analytics/
│   │   │   │   │       └── page.tsx    # AI performance analytics
│   │   │   │   ├── analytics/
│   │   │   │   │   └── page.tsx        # Sales & engagement analytics
│   │   │   │   ├── profile/
│   │   │   │   │   └── page.tsx        # Mentor profile settings
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx        # Account settings
│   │   │   │
│   │   │   └── learner/                # Learner dashboard
│   │   │       ├── dashboard/
│   │   │       │   └── page.tsx        # Learner overview
│   │   │       ├── browse/
│   │   │       │   ├── page.tsx        # Browse mentors
│   │   │       │   └── [id]/
│   │   │       │       └── page.tsx    # Mentor profile
│   │   │       ├── my-learning/
│   │   │       │   ├── page.tsx        # Purchased products
│   │   │       │   └── [productId]/
│   │   │       │       └── page.tsx    # View product with AI Twin
│   │   │       ├── consultations/
│   │   │       │   ├── page.tsx        # My bookings
│   │   │       │   └── [id]/
│   │   │       │       └── page.tsx    # Booking details
│   │   │       ├── profile/
│   │   │       │   └── page.tsx        # Learner profile
│   │   │       └── settings/
│   │   │           └── page.tsx        # Account settings
│   │   │
│   │   ├── mentors/                    # Public mentor pages
│   │   │   ├── page.tsx                # Browse all mentors
│   │   │   └── [id]/
│   │   │       ├── page.tsx            # Public mentor profile
│   │   │       └── products/
│   │   │           └── [productId]/
│   │   │               └── page.tsx    # Product detail page
│   │   │
│   │   ├── products/                   # Public product pages
│   │   │   ├── page.tsx                # Browse all products
│   │   │   └── [id]/
│   │   │       └── page.tsx            # Product detail
│   │   │
│   │   ├── about/
│   │   │   └── page.tsx                # About page
│   │   ├── pricing/
│   │   │   └── page.tsx                # Pricing page
│   │   ├── how-it-works/
│   │   │   └── page.tsx                # How it works
│   │   │
│   │   └── api/                        # API routes (if needed)
│   │       └── webhooks/
│   │           └── stripe/
│   │               └── route.ts        # Stripe webhook handler
│   │
│   ├── components/                     # React components
│   │   ├── ui/                         # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── ...                     # More UI components
│   │   │
│   │   ├── layout/                     # Layout components
│   │   │   ├── Header.tsx              # Main header
│   │   │   ├── Footer.tsx              # Main footer
│   │   │   ├── Sidebar.tsx             # Dashboard sidebar
│   │   │   ├── Navbar.tsx              # Navigation bar
│   │   │   └── DashboardLayout.tsx     # Dashboard wrapper
│   │   │
│   │   ├── auth/                       # Auth components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── RoleGuard.tsx           # Role-based access
│   │   │
│   │   ├── mentor/                     # Mentor components
│   │   │   ├── MentorCard.tsx
│   │   │   ├── MentorProfile.tsx
│   │   │   ├── MentorList.tsx
│   │   │   ├── MentorFilters.tsx
│   │   │   ├── ProductForm.tsx
│   │   │   ├── ProductList.tsx
│   │   │   └── ConsultationCalendar.tsx
│   │   │
│   │   ├── learner/                    # Learner components
│   │   │   ├── LearnerProfile.tsx
│   │   │   ├── GoalsForm.tsx
│   │   │   ├── SkillsSelector.tsx
│   │   │   └── LearningProgress.tsx
│   │   │
│   │   ├── product/                    # Product components
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductDetail.tsx
│   │   │   ├── ProductViewer.tsx       # View purchased products
│   │   │   ├── ProductUploadForm.tsx
│   │   │   └── ProductPurchaseButton.tsx
│   │   │
│   │   ├── consultation/               # Consultation components
│   │   │   ├── BookingForm.tsx
│   │   │   ├── BookingCard.tsx
│   │   │   ├── AvailabilityPicker.tsx
│   │   │   └── BookingCalendar.tsx
│   │   │
│   │   ├── ai/                         # AI components
│   │   │   ├── AIChat.tsx              # AI Twin chat interface
│   │   │   ├── AIChatMessage.tsx
│   │   │   ├── AIChatInput.tsx
│   │   │   ├── AIMatchSuggestions.tsx  # Mentor recommendations
│   │   │   ├── AIMatchCard.tsx
│   │   │   ├── AITwinSetup.tsx         # AI Twin setup wizard
│   │   │   ├── AITrainingDataUpload.tsx
│   │   │   ├── AIAnalyticsDashboard.tsx
│   │   │   ├── AIFeedbackWidget.tsx    # Feedback collection
│   │   │   └── AIConfidenceIndicator.tsx
│   │   │
│   │   ├── payment/                    # Payment components
│   │   │   ├── CheckoutForm.tsx
│   │   │   ├── PaymentMethodSelector.tsx
│   │   │   └── PricingCard.tsx
│   │   │
│   │   ├── analytics/                  # Analytics components
│   │   │   ├── SalesChart.tsx
│   │   │   ├── EngagementMetrics.tsx
│   │   │   ├── RevenueReport.tsx
│   │   │   └── UserGrowthChart.tsx
│   │   │
│   │   └── common/                     # Common components
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorMessage.tsx
│   │       ├── EmptyState.tsx
│   │       ├── Pagination.tsx
│   │       ├── SearchBar.tsx
│   │       ├── FilterBar.tsx
│   │       ├── ConfirmDialog.tsx
│   │       └── FileUploader.tsx
│   │
│   ├── lib/                            # Utility libraries
│   │   ├── api.ts                      # API client (axios/fetch)
│   │   ├── utils.ts                    # General utilities
│   │   ├── constants.ts                # Constants
│   │   ├── validators.ts               # Form validators
│   │   └── cn.ts                       # Tailwind class merger
│   │
│   ├── hooks/                          # Custom React hooks
│   │   ├── useAuth.ts                  # Authentication hook
│   │   ├── useUser.ts                  # Current user data
│   │   ├── useMentors.ts               # Fetch mentors
│   │   ├── useProducts.ts              # Fetch products
│   │   ├── useConsultations.ts         # Fetch bookings
│   │   ├── useAIChat.ts                # AI chat functionality
│   │   ├── useAIMatching.ts            # AI matching
│   │   ├── usePayment.ts               # Payment processing
│   │   ├── useFileUpload.ts            # File upload
│   │   └── useDebounce.ts              # Debounce hook
│   │
│   ├── store/                          # State management (Zustand)
│   │   ├── authStore.ts                # Auth state
│   │   ├── userStore.ts                # User data
│   │   ├── chatStore.ts                # AI chat state
│   │   └── cartStore.ts                # Shopping cart (if needed)
│   │
│   ├── types/                          # TypeScript types
│   │   ├── user.ts                     # User types
│   │   ├── mentor.ts                   # Mentor types
│   │   ├── learner.ts                  # Learner types
│   │   ├── product.ts                  # Product types
│   │   ├── consultation.ts             # Consultation types
│   │   ├── ai.ts                       # AI types
│   │   ├── payment.ts                  # Payment types
│   │   └── api.ts                      # API response types
│   │
│   └── styles/                         # Additional styles
│       ├── globals.css                 # Global styles
│       └── theme.css                   # Theme variables
│
├── public/                             # Static assets
│   ├── images/
│   │   ├── logo.svg
│   │   ├── hero-bg.jpg
│   │   └── placeholders/
│   ├── icons/
│   ├── fonts/
│   └── favicon.ico
│
├── tests/                              # Frontend tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.local.example                  # Environment variables
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json                       # TypeScript config
├── next.config.js                      # Next.js config
├── tailwind.config.ts                  # Tailwind CSS config
├── postcss.config.js                   # PostCSS config
├── components.json                     # shadcn/ui config
├── Dockerfile                          # Docker image for frontend
└── README.md
```

---

## Infrastructure Structure

```
infrastructure/
├── aws/
│   ├── cloudformation/                 # CloudFormation templates
│   │   ├── vpc.yml
│   │   ├── ec2.yml
│   │   ├── rds.yml
│   │   ├── s3.yml
│   │   ├── cloudfront.yml
│   │   └── lambda.yml
│   │
│   ├── terraform/                      # Terraform (alternative to CF)
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   ├── modules/
│   │   │   ├── vpc/
│   │   │   ├── ec2/
│   │   │   ├── rds/
│   │   │   └── s3/
│   │   └── environments/
│   │       ├── dev/
│   │       ├── staging/
│   │       └── production/
│   │
│   └── scripts/
│       ├── deploy.sh                   # Deployment script
│       ├── backup.sh                   # Backup script
│       └── monitoring.sh               # Monitoring setup
│
├── docker/
│   ├── backend/
│   │   └── Dockerfile
│   ├── frontend/
│   │   └── Dockerfile
│   └── nginx/
│       ├── Dockerfile
│       └── nginx.conf
│
├── kubernetes/                         # For future scaling
│   ├── deployment.yml
│   ├── service.yml
│   ├── ingress.yml
│   └── configmap.yml
│
└── ci-cd/
    ├── .github/
    │   └── workflows/
    │       ├── backend-ci.yml
    │       ├── frontend-ci.yml
    │       └── deploy.yml
    └── gitlab-ci.yml                   # Alternative to GitHub Actions
```

---

## Documentation Structure

```
docs/
├── README.md                           # Documentation overview
├── PROJECT_ROADMAP.md                  # ✅ Already created
├── IMPLEMENTATION_PLAN.md              # ✅ Already created
├── AI_STRATEGY.md                      # ✅ Already created
├── AWS_FREE_TIER_GUIDE.md              # ✅ Already created
├── PROJECT_STRUCTURE.md                # ✅ This file
│
├── architecture/
│   ├── system-design.md                # High-level architecture
│   ├── database-schema.md              # Database design
│   ├── api-documentation.md            # API endpoints
│   └── data-flow.md                    # Data flow diagrams
│
├── development/
│   ├── setup-guide.md                  # Development setup
│   ├── coding-standards.md             # Code style guide
│   ├── git-workflow.md                 # Git branching strategy
│   └── testing-guide.md                # Testing best practices
│
├── deployment/
│   ├── aws-deployment.md               # AWS deployment guide
│   ├── docker-deployment.md            # Docker deployment
│   ├── ci-cd-setup.md                  # CI/CD configuration
│   └── monitoring-setup.md             # Monitoring & logging
│
├── ai/
│   ├── ai-architecture.md              # AI system design
│   ├── rag-implementation.md           # RAG system details
│   ├── model-training.md               # Training guide
│   ├── prompt-engineering.md           # Prompt templates
│   └── self-learning-guide.md          # Continuous learning
│
├── features/
│   ├── mentor-matching.md              # Matching algorithm
│   ├── ai-twin.md                      # AI Twin functionality
│   ├── consultation-booking.md         # Booking system
│   ├── payment-processing.md           # Payment flow
│   └── content-translation.md          # Translation feature
│
└── user-guides/
    ├── mentor-guide.md                 # For mentors
    ├── learner-guide.md                # For learners
    └── admin-guide.md                  # For administrators
```

---

## Scripts Structure

```
scripts/
├── setup/
│   ├── setup_dev_environment.sh        # Setup local dev
│   ├── setup_aws.sh                    # Setup AWS resources
│   └── install_dependencies.sh         # Install all dependencies
│
├── database/
│   ├── init_db.py                      # Initialize database
│   ├── seed_data.py                    # Seed test data
│   ├── backup_db.sh                    # Backup database
│   ├── restore_db.sh                   # Restore from backup
│   └── migrate_db.py                   # Run migrations
│
├── deployment/
│   ├── deploy_backend.sh               # Deploy backend to AWS
│   ├── deploy_frontend.sh              # Deploy frontend
│   ├── deploy_all.sh                   # Full deployment
│   └── rollback.sh                     # Rollback deployment
│
├── ai/
│   ├── train_model.py                  # Train AI model
│   ├── evaluate_model.py               # Evaluate performance
│   ├── generate_embeddings.py          # Generate embeddings
│   └── test_ai_twin.py                 # Test AI Twin
│
├── monitoring/
│   ├── check_health.sh                 # Health check
│   ├── monitor_costs.py                # AWS cost monitoring
│   ├── monitor_performance.py          # Performance monitoring
│   └── alert_setup.sh                  # Setup alerts
│
└── utils/
    ├── clean_up.sh                     # Clean up resources
    ├── generate_api_docs.sh            # Generate API docs
    └── run_tests.sh                    # Run all tests
```

---

## Environment Variables

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/gcreators

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=gcreators-media
CLOUDFRONT_DOMAIN=your-cloudfront-domain.net

# AI APIs
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
PINECONE_API_KEY=your-pinecone-key
PINECONE_ENVIRONMENT=us-east-1-aws

# Payment
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SES_SENDER_EMAIL=noreply@gcreators.me

# Application
APP_NAME=GCreators
APP_ENV=development
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ORIGINS=http://localhost:3000

# Monitoring
SENTRY_DSN=your-sentry-dsn  # Optional
```

### Frontend (.env.local)

```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_VERSION=v1

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# App
NEXT_PUBLIC_APP_NAME=GCreators
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Feature Flags
NEXT_PUBLIC_ENABLE_AI_TWIN=true
NEXT_PUBLIC_ENABLE_TRANSLATIONS=false

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## Git Workflow

### Branch Structure

```
main                    # Production-ready code
├── develop             # Integration branch
│   ├── feature/ai-twin
│   ├── feature/mentor-matching
│   ├── feature/payment-integration
│   ├── bugfix/auth-issue
│   └── hotfix/critical-bug
```

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

**Example**:
```
feat(ai-twin): implement RAG system for mentor knowledge

- Add vector database integration with FAISS
- Create embedding generation service
- Implement context-aware response generation
- Add caching for embeddings

Closes #123
```

---

## Testing Structure

### Backend Tests
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_api/test_auth.py

# Run specific test
pytest tests/test_api/test_auth.py::test_register_user
```

### Frontend Tests
```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

---

## Quick Start Commands

### Initial Setup
```bash
# Clone repository
git clone https://github.com/your-org/gcreators.git
cd gcreators

# Setup backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configurations

# Setup database
docker-compose up -d postgres redis
alembic upgrade head
python scripts/seed_data.py

# Run backend
uvicorn app.main:app --reload

# Setup frontend (in new terminal)
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local

# Run frontend
npm run dev
```

### Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Summary

This project structure provides:

1. ✅ **Clear separation** of backend and frontend
2. ✅ **Modular architecture** for easy maintenance
3. ✅ **Scalable structure** for future growth
4. ✅ **Comprehensive testing** setup
5. ✅ **AI modules** isolated for flexibility
6. ✅ **Infrastructure as Code** for reproducibility
7. ✅ **Documentation** for all aspects
8. ✅ **Development scripts** for automation



