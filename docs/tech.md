 Project Brief: “FixedPrice Scotland”

Project Summary

FixedPrice Scotland is a single-purpose property discovery app for the Scottish housing

market.

Its goal is to show buyers only properties with a genuine, usable asking price,

eliminating “Offers Over” and blind bidding listings that waste time and cause budget

misalignment.

The product does not compete with property portals. It acts as a filtering and

classification layer on top of existing listings.

Problem Statement

In Scotland:

• Most residential properties are listed as “Offers Over”

• Final sale prices are opaque until completion

• Buyers routinely view properties they cannot realistically afford

• Fixed-price listings exist but are:

o Inconsistently labeled

o Buried among competitive listings

o Impossible to filter cleanly on major portals

Existing portals answer:

“Show me properties under £X.”

This app answers:

“Show me properties I can actually buy for £X.”

Target User

Primary:

• First-time buyers and budget-constrained buyers in Scotland

Secondary (later):

• Sellers choosing fixed price

• Estate agents willing to advertise transparent pricing

Core Value Proposition

“Every property here has a real asking price. No blind bidding.”

Trust is built through classification confidence, not absolute claims.

Scope (MVP Focus)

This is a narrow, defensible MVP. No social features, no messaging, no listings uploads by

users.

Functional Requirements

1\. Property Listing Ingestion

Data sources (linking, not scraping):

• ESPC

• Rightmove

• Zoopla

• Selected estate agent websites

Method:

• Listings are collected via metadata, feeds, manual curation, or permitted APIs

• Each record stores:

o Listing URL

o Source

o Address / postcode

o Asking price (raw text)

o Description text

o Agent name

o Date first seen

o Last checked date

No scraping of protected content. The app links back to original listings.

2\. Fixed-Price Classification Engine

The core feature is classification, not trust in portal labels.

Each listing is analyzed using text classification on the description and price fields.

Classification Outcomes

Each property must fall into one of three states:

1\. Fixed Price (Explicit)

a. Clear language such as:

i. “Fixed Price £X”

ii. “£X” with no offers language

2\. Fixed Price Likely

a. Ambiguous but buyer-friendly language:

i. “Offers Over £X (Fixed Price Considered)”

ii. “Seller willing to accept fixed price”

3\. Competitive Bidding

a. Excluded from user results

b. Language such as:

i. “Closing date set”

ii. “Offers invited”

iii. “Highly sought after”

iv. “Expected to exceed”

Output

Each listing receives:

• classification\_status (Explicit / Likely / Competitive)

• confidence\_score (e.g. 0–100)

• classification\_reason (short explanation for UI)

3\. Buyer Filters (MVP)

Users can filter by:

• Max budget (£)

• Area (postcode / city / region)

• Fixed price only (default ON)

• Classification confidence (Explicit only vs Explicit + Likely)

4\. “Wasted Viewings Eliminator” (Key Differentiator)

For each listing, the system calculates:

• Whether asking price ≤ user budget

• Historical sale behavior in that postcode:

o Average % over asking

• A success probability indicator (simple heuristic)

Listings are excluded if:

• Similar homes in the same postcode historically sell >10% above ask

Output shown to user:

• “High / Medium / Low chance of securing at asking price”

This can be heuristic-based for MVP (no ML required).

5\. Frontend Experience

Views:

• List view (primary)

• Map view (secondary)

Each listing card shows:

• Price

• Address / area

• Confidence badge

• Short explanation (“Why this is fixed price”)

• Link to original listing

Non-Functional Requirements

• Mobile-first responsive UI

• Fast filtering (sub-second response on dataset)

• Clear disclaimers:

o “Classification is indicative, not guaranteed”

• No user accounts required for browsing (optional for alerts later)

Tech Stack (No-Code / Low-Code)

Data Layer

• Airtable (primary listings database)

Automation

• Make.com

o Scheduled checks

o Status updates

o Re-classification triggers

AI

• OpenAI text classification

o Input: description + price text

o Output: classification + confidence + rationale

Frontend

• Softr or Glide

• Read-only browsing for MVP

MVP Timeline (Indicative)

Phase 1 (2–3 weeks)

• Airtable schema

• Manual + AI classification workflow

• Fixed-price-only feed

• Budget filter

• Map view

Phase 2 (Post-MVP)

• Price change alerts

• “Back to fixed price” alerts

• Estate agent behavior scoring

• Postcode heatmaps (fixed-price friendliness)

Monetization (Not required for MVP build)

Planned model:

• £5–£10/month buyer subscription

• Free listings for fixed-price sellers

• Paid verification badges for agents

• Affiliate referrals (solicitors, mortgage brokers)

No advertising required.

Legal \& Ethical Constraints

• No scraping behind logins or ToS-restricted content

• Link back to original listings

• Use confidence scores, not guarantees

• Position product as a filtering and discovery tool, not a property portal

Success Criteria (MVP)

• User can find fixed-price properties in Scotland that do not appear via portal

filters

• Classification accuracy is explainable and consistent

• App demonstrably reduces wasted viewings

• Clear differentiation from Rightmove/Zoopla

Out of Scope (Explicitly)

• User-submitted listings

• Messaging buyers/sellers

• Offer submission

• Price negotiation tools

• Full sales history scraping

Expansion Potential (Not for MVP)

• England: guide price abuse detection

• Ireland: bidding transparency

• New-build price clarity tools

This brief is intentionally tight. The strength of the product is focus, not breadth.



Tech stack

1\. Data Storage \& Management



Primary tool: Airtable



    Acts as your central database for all property listings.



    Stores:



        Listing URL



        Source (Rightmove, Zoopla, ESPC, agent site)



        Address / postcode



        Price (raw text)



        Description text



        Classification status / confidence



        Date first seen / last checked



    Benefits:



        Easy to update manually or via automation



        Native API for integrations



        Spreadsheet-like interface for transparency and debugging



2\. Automation \& Workflow



Primary tool: Make.com (formerly Integromat)



    Handles scheduled checks, updates, and data refreshes.



    Integrates with Airtable, OpenAI, and frontend tools (Softr/Glide).



    Use cases:



        Daily / weekly sync of new listings



        Trigger AI classification when new listings are added



        Update confidence scores automatically



    No coding required, visual workflow editor



3\. AI / Classification



Primary tool: OpenAI (text classification endpoint)



    Analyzes the listing descriptions and price text to determine fixed-price status.



    Outputs:



        Classification: ✅ Fixed Price, 🟡 Likely Fixed Price, ❌ Competitive Bidding



        Confidence score



        Reason / rationale (optional, for transparency)



    Integrates via Make.com to automatically update Airtable



4\. Frontend / User Interface



Options: Softr or Glide



    Softr:



        Connects directly to Airtable



        Provides list, map, and filter views



        User authentication optional (for alerts later)



    Glide:



        Simple mobile-first experience



        Can display data from Airtable



    Features:



        Map view of listings



        Budget \& area filters



        Confidence badges visible on listings



        Links to original portals



5\. Optional / Future Enhancements



    Notifications / Alerts:



        Email or push alerts via Make.com for “Back to fixed price” or price changes



    Analytics / Heatmaps:



        Simple dashboards via Softr or Airtable charts for estate agent behavior or postcode trends



    Version control for classification logic:



        Keep AI prompts / classification rules in Notion or Airtable



Recommended Stack Summary Table

Layer 	Tool / Technology 	Purpose

Data Storage 	Airtable 	Central database of listings

Automation / Workflows 	Make.com 	Scheduled sync, AI triggers

AI Classification 	OpenAI (text classification) 	Determine fixed-price status and confidence

Frontend / UI 	Softr / Glide 	Display listings, map, filters, badges

Optional Analytics 	Airtable charts / Softr dashboards 	Track market trends, agent behavior



This stack is completely no-code for MVP, defensible (no scraping, clear links to sources), and scalable for Phase 2 features like alerts and heatmaps.


Alternative Tech Stack Options (Easy but Professional)

OPTION 1: Modern Full-Stack JavaScript (Easiest to Learn)
Frontend: Next.js (React framework)
Backend: Next.js API routes or Node.js
Database: PostgreSQL (Supabase) or MongoDB Atlas
Language: TypeScript
Hosting: Vercel (frontend) + Railway/Render (backend)
AI: OpenAI API (direct integration)
Why: One language (TypeScript), massive community, excellent tooling, fast development

OPTION 2: Python Fast & Clean
Frontend: Streamlit or React (via API)
Backend: FastAPI (Python)
Database: PostgreSQL or SQLite (starter)
Language: Python
Hosting: Render / Fly.io / Railway
AI: OpenAI API (native Python SDK)
Why: Perfect for AI/ML tasks, simple syntax, great data processing

OPTION 3: All-in-One Framework
Tool: Bubble.io or Retool
Database: Built-in or PostgreSQL
Language: Visual/No-code with JavaScript expressions
Why: Fastest MVP, visual builder, handles auth/routing automatically

OPTION 4: Serverless Stack (Low Maintenance)
Frontend: React (Vite) or Next.js
Backend: Cloudflare Workers / AWS Lambda
Database: PlanetScale (MySQL) or Supabase (PostgreSQL)
Language: TypeScript / JavaScript
Hosting: Cloudflare Pages + Workers (free tier generous)
Why: No server management, auto-scaling, pay-per-use

OPTION 5: Database-First (Simplest Backend)
Frontend: Next.js or SvelteKit
Backend: Supabase (PostgreSQL + Auth + Storage + Functions)
Language: TypeScript
Hosting: Vercel + Supabase (both free tiers)
Why: Database IS the backend, built-in auth, real-time subscriptions

## Selected Tech Stack

**Frontend:** Next.js (TypeScript)  
**Backend:** Python (FastAPI)  
**Database:** Supabase (PostgreSQL + Auth + Storage)  

See `tech-stack.md` for detailed implementation guide.

**Why This Stack:**
- Next.js: Fast, SEO-friendly, great developer experience
- Python/FastAPI: Perfect for AI/ML tasks, easy OpenAI integration
- Supabase: Managed database, built-in auth, free tier sufficient
- Professional yet easy to build and maintain

**Deployment:**
- Frontend: Vercel
- Backend: Railway / Render / Fly.io
- Database: Supabase (managed)

**Quick Tech Decisions:**
• Authentication: Supabase Auth
• Maps: Mapbox GL JS or Leaflet
• Search/Filter: PostgreSQL full-text search
• Forms: React Hook Form + Zod validation
• Styling: Tailwind CSS
• Testing: Vitest + React Testing Library
• Monitoring: Sentry