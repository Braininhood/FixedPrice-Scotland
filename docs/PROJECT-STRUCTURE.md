# Project Structure

This document describes the organization of the FixedPrice Scotland project.

## Directory Structure

```
fixedprice-scotland/
├── backend/                    # Python FastAPI Backend
│   ├── app/                    # Application code
│   │   ├── api/               # API routes
│   │   ├── core/              # Core configuration
│   │   ├── models/            # Pydantic models
│   │   ├── services/          # Business logic
│   │   └── templates/          # Email templates
│   ├── certs/                 # SSL certificates
│   ├── requirements.txt       # Python dependencies
│   └── main.py                # Application entry point
│
├── frontend/                   # Next.js Frontend
│   ├── src/
│   │   ├── app/               # Next.js App Router pages
│   │   ├── components/       # React components
│   │   ├── contexts/         # React contexts
│   │   └── lib/              # Utilities and API client
│   └── package.json           # Node dependencies
│
├── docs/                       # Project Documentation
│   ├── archive/               # Archived troubleshooting/fix docs
│   ├── migrations/            # Database migration scripts
│   ├── ADMIN-FULL-SETUP.md   # Admin setup guide
│   ├── implementation-plan.md # Project roadmap
│   ├── tech-stack.md          # Technology stack details
│   └── ...                    # Other documentation
│
├── supabase/                   # Supabase Configuration
│   └── migrations/            # Supabase migration files
│
├── tests/                      # Test Suite
│   ├── test_api/              # API tests
│   ├── scripts/               # Test scripts
│   └── test-data/             # Test data files
│
├── .gitignore                  # Git ignore rules
├── pyrightconfig.json         # Python type checking config
└── README.md                  # Project overview
```

## File Organization Rules

### Documentation Files

- **Active Documentation**: Place in `docs/` root
  - Setup guides
  - Architecture documentation
  - API documentation
  - Configuration guides

- **Archived Documentation**: Move to `docs/archive/`
  - Temporary fix documentation
  - Troubleshooting notes (resolved)
  - Historical status updates

### SQL Files

- **Active Migrations**: Place in `supabase/migrations/`
  - Current database schema changes
  - Feature-related migrations

- **Reference SQL**: Place in `docs/migrations/`
  - Historical migrations
  - Setup scripts
  - One-time fixes

### Code Files

- **Backend**: All Python code in `backend/app/`
- **Frontend**: All TypeScript/React code in `frontend/src/`
- **Tests**: All test files in `tests/`

## Key Files

### Root Level
- `README.md` - Project overview and getting started
- `.gitignore` - Git ignore patterns
- `pyrightconfig.json` - Python type checking configuration

### Backend
- `backend/main.py` - FastAPI application entry point
- `backend/requirements.txt` - Python dependencies
- `backend/app/core/config.py` - Application configuration
- `backend/app/core/security.py` - Authentication/authorization

### Frontend
- `frontend/package.json` - Node.js dependencies
- `frontend/src/lib/api/client.ts` - API client configuration
- `frontend/src/contexts/AuthContext.tsx` - Authentication context

### Documentation
- `docs/implementation-plan.md` - Project roadmap
- `docs/tech-stack.md` - Technology details
- `docs/ADMIN-FULL-SETUP.md` - Admin setup instructions

## Migration Files

### Supabase Migrations (`supabase/migrations/`)
These are active, versioned migrations that should be run in order:
- `listings_created_by_user_id.sql` - Adds user ownership to listings
- `listing_extra_image_urls.sql` - Adds extra image URLs column

### Reference Migrations (`docs/migrations/`)
These are historical or reference migrations:
- `001_add_listings_image_url.sql` - Historical migration reference

## Cleanup Status

✅ Project structure organized
✅ Documentation categorized
✅ SQL files organized
✅ Archive folder created for old files
