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


# GCreators Project Roadmap

## Project Overview
**GCreators** is an AI-powered operating system for the knowledge economy that transforms human expertise into scalable, globally accessible businesses through AI twins, multilingual support, and unified infrastructure.

### Technology Stack
- **Backend**: Python (FastAPI/Django)
- **Frontend**: React with Next.js
- **Infrastructure**: AWS Free Tier
- **AI Integration**: OpenAI API (GPT-4o-mini for cost optimization) + Custom Neural Network
- **Database**: PostgreSQL (AWS RDS Free Tier) + Vector Database (Pinecone Free Tier)

---

## Phase 1: Foundation & MVP Enhancement (Months 1-3)

### Core Infrastructure Setup
- **Week 1-2**: AWS Infrastructure Setup
  - Configure AWS Free Tier services
  - Set up EC2 instances (t2.micro)
  - Configure RDS PostgreSQL (db.t3.micro, 20GB)
  - Set up S3 buckets for file storage (5GB free)
  - Configure CloudFront CDN
  - Set up AWS Lambda for serverless functions

- **Week 3-4**: Backend Development
  - Python FastAPI setup with async support
  - User authentication system (JWT)
  - Database schema design and migrations
  - RESTful API endpoints for existing features
  - File upload/download system
  - Payment integration (Stripe)

- **Week 5-6**: Frontend Development
  - Next.js 14+ setup with App Router
  - TypeScript configuration
  - Tailwind CSS + shadcn/ui components
  - Responsive design system
  - User authentication flows
  - Mentor/Learner dashboards

- **Week 7-8**: Core Features Integration
  - Profile management (Mentor & Learner)
  - Digital product marketplace
  - Consultation booking system
  - Payment processing
  - Email notifications (AWS SES)

- **Week 9-12**: Testing & Optimization
  - Unit and integration testing
  - Performance optimization
  - Security audit
  - Bug fixes
  - Documentation

---

## Phase 2: AI Integration - Level 1 (Months 4-6)

### AI-Powered Mentor Matching
- **Month 4**: Data Collection & Preparation
  - Design user profile questionnaire
  - Collect mentor expertise data
  - Create training dataset for matching algorithm
  - Implement data pipeline
  
- **Week 1-2**: Basic AI Matching System
  - Integrate OpenAI API (GPT-4o-mini for cost efficiency)
  - Build prompt engineering system for mentor recommendations
  - Create embedding system for user goals and mentor expertise
  - Implement vector similarity search (Pinecone free tier)

- **Week 3-4**: Matching Algorithm
  - Skills and goals matching logic
  - Collaborative filtering implementation
  - Rating and feedback system
  - A/B testing framework

### AI Assistant (Basic Version)
- **Month 5**: Consultation Assistant
  - RAG (Retrieval Augmented Generation) system setup
  - Knowledge base creation per mentor
  - Basic Q&A functionality
  - Context-aware responses about services/products

- **Week 1-2**: Implementation
  - Document processing pipeline
  - Vector database integration
  - OpenAI API integration for responses
  - Chat interface development

- **Week 3-4**: Enhancement
  - Conversation history management
  - Context retention
  - Multi-turn dialogue support
  - Response quality improvement

### Cost Optimization Strategy
- **Month 6**: AI Cost Management
  - Implement response caching
  - Rate limiting per user
  - Use GPT-4o-mini (70% cheaper than GPT-4)
  - Prompt optimization for token reduction
  - Fallback to cached responses when possible

---

## Phase 3: AI Twin Development (Months 7-10)

### Custom Neural Network Foundation
- **Month 7**: Neural Network Architecture
  - Design custom transformer model architecture
  - Set up training infrastructure (AWS SageMaker free tier)
  - Create data collection pipeline from mentor interactions
  - Build knowledge extraction system

- **Week 1-2**: Data Pipeline
  - Mentor content ingestion system
  - Text preprocessing and cleaning
  - Knowledge graph creation
  - Training data generation

- **Week 3-4**: Model Training Setup
  - Transfer learning from open-source models (Llama 2, Mistral)
  - Fine-tuning pipeline
  - Model versioning system
  - Evaluation metrics

### AI Twin Core Features
- **Month 8-9**: AI Twin Implementation
  - Personalized knowledge base per mentor
  - Style transfer learning (mentor's communication style)
  - Context-aware guidance system
  - Interactive content navigation

- **Month 8 Deliverables**:
  - AI Twin creation wizard for mentors
  - Training data collection interface
  - Basic personality modeling
  - Q&A functionality

- **Month 9 Deliverables**:
  - Proactive guidance system
  - Multi-step problem solving
  - Goal-based recommendations
  - Progress tracking integration

### Self-Learning System
- **Month 10**: Continuous Learning Implementation
  - User interaction logging
  - Feedback collection system
  - Automatic retraining pipeline
  - Performance monitoring dashboard

- **Week 1-2**: Learning Pipeline
  - Feedback loop implementation
  - Quality scoring system
  - Automated data labeling
  - Model improvement metrics

- **Week 3-4**: Deployment
  - Blue-green deployment for models
  - A/B testing framework
  - Rollback mechanisms
  - Performance monitoring

---

## Phase 4: Global Scaling Features (Months 11-13)

### Multi-Language Support
- **Month 11**: Translation System
  - Integration with translation APIs (AWS Translate free tier)
  - Custom translation model for domain-specific terms
  - Language detection
  - Content localization system

- **Week 1-2**: Implementation
  - Automated translation pipeline
  - Quality assurance system
  - Language preference management
  - Multi-language UI support

- **Week 3-4**: Optimization
  - Translation caching
  - Context-aware translations
  - Cultural adaptation
  - Testing across languages

### Format Conversion AI
- **Month 12**: Content Transformation
  - Text-to-video generation (using AWS services)
  - Course material reformatting
  - Presentation to course conversion
  - Multi-format export system

- **Week 1-2**: Core Features
  - Document parsing and analysis
  - Content structure extraction
  - Format templates creation
  - Conversion engine

- **Week 3-4**: Enhancement
  - Quality improvement
  - Style preservation
  - Automated thumbnail generation
  - Preview system

### Global Distribution
- **Month 13**: Scalability & Performance
  - CDN optimization for global reach
  - Multi-region deployment strategy
  - Performance monitoring
  - Load balancing

---

## Phase 5: Advanced Features & Scale (Months 14-18)

### Advanced AI Capabilities
- **Month 14-15**: Enhanced AI Twin
  - Emotional intelligence modeling
  - Advanced reasoning capabilities
  - Multi-modal learning (text, audio, video)
  - Predictive analytics for learner success

### Platform Expansion
- **Month 16-17**: Ecosystem Growth
  - API for third-party integrations
  - Mobile app development (React Native)
  - Community features
  - Gamification system

### Enterprise Features
- **Month 18**: Business Growth
  - Team accounts for organizations
  - Advanced analytics dashboard
  - White-label solutions
  - Enterprise API access

---

## Human-AI Collaboration Principles

### AI Advisory System with Human Final Decision
Throughout all phases, maintain these principles:

1. **AI as Advisor, Human as Decision Maker**
   - AI provides recommendations with confidence scores
   - Clear explanation of AI reasoning
   - Multiple options presented when applicable
   - Human approval required for critical decisions

2. **Transparency**
   - Always show when AI is involved
   - Explain AI limitations
   - Provide override mechanisms
   - Clear audit trails

3. **Safety & Ethics**
   - Content moderation system
   - Bias detection and mitigation
   - Privacy-first approach
   - User data protection (GDPR compliance)

4. **Quality Control**
   - Human review of AI outputs
   - Feedback mechanisms
   - Quality metrics monitoring
   - Continuous improvement cycles

---

## Success Metrics

### Technical Metrics
- System uptime: >99.5%
- API response time: <500ms (p95)
- AI response time: <3s
- Match accuracy: >85%
- User satisfaction: >4.5/5

### Business Metrics
- User acquisition rate
- Creator retention rate
- Transaction volume
- Revenue per creator
- AI Twin adoption rate

---

## Risk Management

### Technical Risks
- **AWS Free Tier Limits**: Monitor usage, implement alerts
- **AI Costs**: Aggressive caching, rate limiting, prompt optimization
- **Scalability**: Design for horizontal scaling from day 1
- **Data Security**: Encryption, regular audits, compliance

### Business Risks
- **User Adoption**: Beta testing, feedback loops, iterative improvement
- **Competition**: Focus on unique AI Twin value proposition
- **Regulatory**: Stay updated on AI regulations, data privacy laws

