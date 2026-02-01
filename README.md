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
- **No scraping** – manual curation + official APIs/feeds only (see [data-sources-ingestion.md](docs/data-sources-ingestion.md))

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
├── docs/                     # Documentation
│   ├── migrations/           # SQL scripts (Supabase migrations)
│   ├── portal-connections.md # How Rightmove, Zoopla, ESPC, etc. connect
│   ├── data-sources-ingestion.md
│   ├── aws-setup-guide.md
│   └── ...
├── tests/                    # Test suite
│   ├── test_api/             # Pytest API tests
│   ├── frontend/             # Jest frontend tests
│   ├── scripts/              # create-test-users, create-test-listings
│   └── ...
├── pyrightconfig.json
└── README.md
```

**Note:** Supabase is used as a remote service (configured via env vars). Database migrations live in `docs/migrations/` and are applied in the Supabase project. See [docs/PROJECT-STRUCTURE.md](docs/PROJECT-STRUCTURE.md) for detailed structure.

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

\* See [backend/.env.example](backend/.env.example) and [docs/](docs/) for details.

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

\* When served over HTTPS via Nginx, the frontend uses same-origin `/api/v1` and `/health` so Nginx can proxy to the backend. See [docs/nginx-fixedprice-scotland.conf](docs/nginx-fixedprice-scotland.conf).

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

**No scraping.** See [docs/portal-connections.md](docs/portal-connections.md) for how each portal connects and [docs/data-sources-ingestion.md](docs/data-sources-ingestion.md) for ingestion policies.

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

- **AWS EC2**: [docs/aws-setup-guide.md](docs/aws-setup-guide.md) – Nginx, PM2, systemd, SSL
- **Nginx config**: [docs/nginx-fixedprice-scotland.conf](docs/nginx-fixedprice-scotland.conf)
- **Options**: [docs/deployment-options.md](docs/deployment-options.md)

---

## Documentation

| Doc | Description |
|-----|-------------|
| [SETUP-GUIDE.md](docs/SETUP-GUIDE.md) | Complete setup guide |
| [SETUP-CHECKLIST.md](docs/SETUP-CHECKLIST.md) | Setup checklist |
| [ADMIN-FULL-SETUP.md](docs/ADMIN-FULL-SETUP.md) | Admin dashboard setup |
| [PROJECT-STRUCTURE.md](docs/PROJECT-STRUCTURE.md) | Detailed project structure |
| [tech-stack.md](docs/tech-stack.md) | Technology stack details |
| [implementation-plan.md](docs/implementation-plan.md) | Roadmap |
| [portal-connections.md](docs/portal-connections.md) | How portals & agents connect |
| [data-sources-ingestion.md](docs/data-sources-ingestion.md) | Data sources & ingestion policy |
| [zoopla-api-integration.md](docs/zoopla-api-integration.md) | Zoopla API setup |
| [aws-setup-guide.md](docs/aws-setup-guide.md) | AWS EC2 deployment |
| [docs/archive/](docs/archive/) | Archived troubleshooting docs |

---

## License

MIT
