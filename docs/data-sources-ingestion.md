# Data Sources & Ingestion Methods

## Overview

This document outlines the data sources, ingestion methods, and policies for the FixedPrice Scotland application. The MVP focuses on **manual curation** with a clear **no-scraping policy**.

**Quick reference:** For how **Rightmove, Zoopla, ESPC, OnTheMarket, S1homes**, and agents (e.g. Rettie, Fern, KW Scotland) connect to the app, see **[portal-connections.md](portal-connections.md)**.

---

## Data Sources Research

Deep investigation (portals and agents): see **[portal-connections.md](portal-connections.md)** for full detail, contacts, and how each connects to the app.

### Property Portals

#### 1. Rightmove
- **Website**: https://www.rightmove.co.uk
- **Role**: UK’s largest property portal (~1M residential properties advertised monthly).
- **API / Feeds (investigation)**:
  - **RTDF (Real Time Data Feed) / ADF**: For **estate agents and software providers** to **upload** properties TO Rightmove (send/remove listings, branch property list). Not for third-party consumption of Rightmove listings. Spec: https://www.rightmove.co.uk/adf.html; EULA applies; contact **adfsupport@rightmove.co.uk** for schemas and test environment.
  - **Rightmove Property Data / Data Services**: B2B data product (market intelligence, bespoke analysis, valuations, risk). Audience: investors, consultants, agents, developers, etc. Contact: https://www.rightmove.co.uk/property-data/contact-us/
- **Public API for listing consumption**: None. No public “pull” API for aggregation apps.
- **Status**: Manual ingestion only for MVP. For future bulk data, enquire with Rightmove Data Services.

#### 2. Zoopla
- **Website**: https://www.zoopla.co.uk
- **Commercial/API**: Hometrack (https://www.hometrack.com) – Zoopla’s data/API arm.
- **API / Feeds (investigation)**:
  - **Listings API**: Documented endpoints (e.g. `GET /listing/property/items`, `GET /listing/property/{propertyId}`). OAuth 2.0 client credentials; auth: `https://services-auth.services.zoopla.co.uk`. **Not publicly available** – requires commercial agreement with Hometrack. Contact: https://www.hometrack.com/contact-us/
  - **Hometrack data**: Property comparables, market intelligence, site appraisals; some as batch file delivery.
  - **Leads API**: For agents (appraisal/applicant leads). **Premium Listings API**: Programmatic activation of premium listings (credits). **Alto API**: For agents using Alto PMS.
- **Documentation**: https://developers.zoopla.co.uk/
- **Status**: App has Zoopla integration ready (OAuth, sync endpoint). Use when Hometrack access is granted. Manual ingestion always available with `source: zoopla`.

#### 3. ESPC (Edinburgh Solicitors Property Centre)
- **Website**: https://www.espc.com
- **Role**: Edinburgh and Lothians-focused (solicitor estate agents).
- **API / Feeds (investigation)**:
  - **Public**: Monthly House Price Reports (Edinburgh, Lothians, Fife, Scottish Borders); sales archive for solicitor agents. No documented public API or data feed for listing ingestion.
  - **Partnership**: No public technical spec; contact ESPC directly (website or solicitor agent network) for data/API partnership.
- **Status**: Manual ingestion only; `source: espc`. Contact ESPC for future feed/API.

#### 4. OnTheMarket
- **Website**: https://www.onthemarket.com
- **API / Feeds (investigation)**:
  - **RTDF**: For **agents/software providers** to **send** properties TO OnTheMarket (Rightmove-style RTDF). Not a public “pull” API for third-party listing consumption. Some integrations (e.g. Property Hive) support both Rightmove and OnTheMarket; lead import endpoints exist for partners.
- **Public API for listing consumption**: None.
- **Status**: Manual ingestion only; `source: onthemarket`. Contact OnTheMarket for commercial/partner access if needed.

#### 5. S1homes
- **Website**: https://www.s1homes.com
- **Role**: Scotland’s largest property website (buy, rent, developments).
- **API / Feeds (investigation)**:
  - Agents/developers can advertise on S1homes. No **public** API or data feed specification found. Contact S1homes (website, partner/developer enquiries) for any data or feed options.
- **Status**: Manual ingestion only; `source: s1homes`. Contact S1homes for partnership.

#### 6. Agent Websites (Rettie, Fern/Ferhome, KW Scotland)
- **Rettie**: https://www.rettie.co.uk – Scotland (Glasgow, Edinburgh) and North East England. Listings and property research; no public API/feed. Contact for bespoke data.
- **Fern / Ferhome**: https://www.ferhome.co.uk – Independent agency, Helensburgh. “Fern” may refer to Ferhome or another Fern-branded agent; no public API/feed.
- **KW Scotland (Keller Williams)**: https://kwscotland.co.uk – Scotland-wide. Part of Keller Williams; no public API.
- **In app**: Use `source: "agent"` (or `"other"`), `agent_name` (e.g. "Rettie", "Ferhome", "KW Scotland"), `agent_url`, and listing URL. Manual ingestion only; no public feeds.

---

## Ingestion Methods

### ✅ Permitted Methods

#### 1. Manual Curation (MVP Primary Method)
- **Description**: Manual entry of listings by admin/agent users
- **Process**:
  1. Admin/agent enters listing URL and basic details via API endpoint
  2. System validates data and checks for duplicates
  3. System auto-parses price and triggers AI classification
  4. Listing is saved and made available to users
- **Endpoint**: `POST /api/v1/ingestion/manual`
- **Access**: Admin and Agent roles only
- **Advantages**:
  - Full control over data quality
  - No legal/ToS concerns
  - Curated, high-quality listings
- **Limitations**:
  - Time-intensive
  - Requires manual effort
  - Not scalable for large volumes

#### 2. Official APIs/Feeds
- **Description**: Use official APIs or data feeds provided by property portals
- **Requirements**:
  - Valid API key/credentials
  - Compliance with API terms of service
  - Rate limiting and usage restrictions
- **Status**: **Zoopla integration prepared** (requires commercial access)
- **Examples**:
  - **Zoopla API**: Integration service created, requires Hometrack commercial agreement
    - OAuth2 authentication implemented
    - Listing sync service prepared
    - API endpoints created (`/api/v1/zoopla/sync`)
    - See `docs/zoopla-api-integration.md` for details
  - Partner feeds from Rightmove/ESPC (future)
  - RSS feeds from agent websites (future)

#### 3. Metadata/Public Data
- **Description**: Use publicly available metadata (Open Graph, Schema.org, etc.)
- **Requirements**:
  - Data must be publicly accessible
  - No authentication required
  - No ToS violations
- **Status**: Future consideration
- **Notes**: Limited usefulness for property listings

---

## ❌ Prohibited Methods

### 1. Web Scraping
- **Policy**: **NO SCRAPING** of protected content or behind logins
- **Rationale**:
  - Violates Terms of Service
  - Legal risks
  - Unreliable and fragile
  - Ethical concerns
- **Examples of Prohibited Scraping**:
  - Scraping property listings from portals
  - Scraping content behind login walls
  - Scraping content with robots.txt restrictions
  - Automated data extraction from websites

### 2. ToS-Restricted Content
- **Policy**: **NO SCRAPING** of ToS-restricted content
- **Rationale**:
  - Legal compliance
  - Respect for content owners
  - Risk of legal action
- **Examples**:
  - Content explicitly prohibited in Terms of Service
  - Content requiring authentication
  - Content with rate limiting or access restrictions

---

## MVP Approach

### Phase 1: Manual Curation (Current)
- **Method**: Manual entry via admin/agent interface
- **Process**:
  1. Admin/agent identifies property listing
  2. Enters listing URL and details via API
  3. System validates and classifies listing
  4. Listing becomes available to users
- **Volume**: 20-50 sample listings for MVP
- **Quality**: High (curated, verified)

### Phase 2: Automated Feeds (Future)
- **Method**: Official APIs/feeds from property portals
- **Requirements**:
  - Partnership agreements
  - API access and credentials
  - Compliance with terms
- **Volume**: Scalable
- **Quality**: Depends on feed quality

---

## Data Quality Standards

### Required Fields
- **listing_url**: URL of the original listing (required)
- **source**: Property portal or agent (required)
- **address**: Full property address (required, min 5 chars)
- **price_raw**: Raw price text (required)
- **price_numeric**: Numeric price (auto-parsed if not provided)

### Optional Fields
- **postcode**: Postcode (recommended)
- **city**: City name
- **region**: Region/County
- **description**: Property description
- **agent_name**: Estate agent name
- **agent_url**: Estate agent website

### Validation Rules
- URL must be valid and from known property portals
- Address must be at least 5 characters
- Source must be one of: rightmove, zoopla, espc, s1homes, onthemarket, agent, other
- Duplicate checking by URL (prevents duplicate entries)

---

## Duplicate Detection

### Method
- **Field**: `listing_url` (unique constraint)
- **Process**: Check for existing listing with same URL before insertion
- **Response**: Returns existing listing if duplicate found

### Future Enhancements
- Fuzzy matching by address
- Price and date comparison
- Automatic deduplication

---

## Link Back to Original Source

### Requirement
- **All listings must link back to original source**
- **Implementation**: `listing_url` field stores original URL
- **Display**: Frontend shows "View Original" button linking to `listing_url`
- **Purpose**: 
  - Attribution to original source
  - User access to full listing details
  - Legal compliance

---

## Future Integration Plans

### Short Term (Post-MVP)
1. **Research API / Data Access** (see [portal-connections.md](portal-connections.md) for contacts):
   - **Rightmove**: Rightmove Data Services – https://www.rightmove.co.uk/property-data/contact-us/ (B2B data; no public listing API). ADF/RTDF is for agents to *upload* only – adfsupport@rightmove.co.uk.
   - **Zoopla**: Hometrack – https://www.hometrack.com/contact-us/ (listings API commercial access). App integration already implemented.
   - **ESPC**: ESPC website / solicitor agent network – https://www.espc.com (no public API/feed; partnership enquiry).
   - **OnTheMarket**: Commercial/partner team via website (RTDF is for agents to *upload*; no public pull API).
   - **S1homes**: S1homes website – partner/developer enquiries (no public API/feed found).
   - **Agents (Rettie, Ferhome, KW Scotland)**: Agent websites for bespoke data/partnership.

2. **Document Available APIs**:
   - API endpoints and authentication
   - Rate limits and usage restrictions
   - Data format and fields
   - Terms of service compliance

### Long Term
1. **Automated Feed Integration**:
   - Implement feed parsers for official APIs
   - Set up scheduled sync jobs
   - Handle rate limiting and errors
   - Monitor feed quality

2. **Agent Partnerships**:
   - Direct relationships with estate agents
   - Agent-specific data feeds
   - Verified agent listings

---

## Compliance & Legal

### Terms of Service
- **All ingestion methods must comply with source ToS**
- **No scraping of ToS-restricted content**
- **Respect robots.txt and rate limits**

### Data Attribution
- **All listings link back to original source**
- **Clear attribution in UI**
- **Respect copyright and intellectual property**

### Privacy
- **No collection of personal data without consent**
- **Compliance with GDPR and data protection laws**
- **Secure storage of listing data**

---

## Monitoring & Maintenance

### Data Quality Metrics
- **Total listings**: Track total ingested listings
- **Classification rate**: Percentage of classified listings
- **Source distribution**: Listings by source
- **Duplicate detection**: Number of duplicates prevented

### Review Process
- **Regular review of listing quality**
- **Manual verification of classifications**
- **User feedback on listing accuracy**
- **Update ingestion methods based on feedback**

---

## Version History

- **v1.1** (2026-01-28): Deep investigation of portals and agents
  - Rightmove: clarified RTDF/ADF (upload only), Rightmove Data Services (B2B data product), contacts
  - Zoopla: Hometrack listings API (gated), OAuth2, batch data options
  - ESPC: no public API/feed; House Price Reports, sales archive; contact for partnership
  - OnTheMarket: RTDF for agents to upload; no public pull API
  - S1homes: Scotland’s largest property site; no public API; contact for partnership
  - Agents: Rettie, Fern/Ferhome, KW Scotland – no public feeds; manual ingestion with `source: agent`
  - Cross-reference to portal-connections.md for full detail and contact table
- **v1.0** (2026-01-24): Initial documentation
  - Defined no-scraping policy
  - Documented manual curation process
  - Outlined future API integration plans
  - Established data quality standards
