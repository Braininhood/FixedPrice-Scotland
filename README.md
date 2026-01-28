# FixedPrice Scotland

FixedPrice Scotland is a platform dedicated to identifying and listing "Fixed Price" property listings in Scotland, helping buyers find homes with predictable pricing in a traditionally competitive "Offers Over" market.

## Project Overview

- **Timeline:** 2-3 weeks (MVP)
- **Architecture:** Monorepo (Separate Backend & Frontend)
- **Stack:** 
  - **Frontend:** Next.js (TypeScript) + Tailwind CSS
  - **Backend:** Python FastAPI
  - **Database:** Supabase (PostgreSQL + Auth)
  - **AI:** OpenAI GPT-4 for listing classification

## Why FixedPrice Scotland?

In the Scottish property market, most listings are "Offers Over," which often leads to bidding wars and uncertainty. This platform uses AI to scan and classify listings to find those that are explicitly fixed price or highly likely to be buyer-friendly, reducing wasted viewings and increasing transparency.

## Repository Structure

```
fixedprice-scotland/
├── frontend/              # Next.js Application
├── backend/               # Python FastAPI Application
├── docs/                  # Project Documentation
│   ├── archive/           # Archived troubleshooting docs
│   ├── migrations/        # Historical SQL migrations
│   └── ...                # Active documentation
├── supabase/              # Supabase Configuration
│   └── migrations/        # Active database migrations
├── tests/                 # Test Suite
└── README.md              # Project Overview
```

For detailed structure information, see [docs/PROJECT-STRUCTURE.md](docs/PROJECT-STRUCTURE.md)

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- Supabase Account
- OpenAI API Key

### Running locally

1. **Backend** (API must be running for the frontend to load account/listings data):
   ```bash
   cd backend
   .\venv\Scripts\activate   # or source venv/bin/activate
   python main.py
   ```
   API runs at [http://localhost:8000](http://localhost:8000). Health check: [http://localhost:8000/health](http://localhost:8000/health). The API verifies Supabase login tokens via **JWKS** (no JWT secret needed if your project uses JWT Signing Keys).

2. **Frontend**
   ```bash
   cd frontend
   npm install && npm run dev
   ```
   App runs at [http://localhost:3000](http://localhost:3000). Set `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1` in `frontend/.env.local` if you use a different API URL. If you see "Network Error" or "Backend unreachable", start the backend first.

### Documentation

Detailed documentation can be found in the `docs/` folder:

**Setup & Configuration:**
- `SETUP-GUIDE.md`: Complete setup guide
- `SETUP-CHECKLIST.md`: Setup checklist
- `ADMIN-FULL-SETUP.md`: Admin dashboard setup

**Architecture & Planning:**
- `implementation-plan.md`: The roadmap for this project
- `tech-stack.md`: Detailed information about the technology stack
- `PROJECT-STRUCTURE.md`: Project structure documentation

**Deployment:**
- `aws-setup-guide.md`: Instructions for deploying to AWS EC2
- `deployment-options.md`: Deployment options

**Archived Documentation:**
- `docs/archive/`: Historical troubleshooting and fix documentation
- `docs/migrations/`: Historical database migration scripts

## License

MIT
