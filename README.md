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
└── README.md              # Project Overview
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- Supabase Account
- OpenAI API Key

### Documentation

Detailed documentation can be found in the `docs/` folder:
- `implementation-plan.md`: The roadmap for this project.
- `tech-stack.md`: Detailed information about the technology stack.
- `aws-setup-guide.md`: Instructions for deploying to AWS EC2.

## License

MIT
