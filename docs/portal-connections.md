# How Portals & Agents Connect to FixedPrice Scotland

This document explains how **Rightmove, Zoopla, ESPC, OnTheMarket, S1homes**, and agents such as **Rettie, Fern/Ferhome, KW Scotland** connect to the app. It is based on a deep investigation of each source’s API access, data feeds, partner programmes, and terms.

---

## Summary

| Source | How we connect | API/feed status |
|--------|----------------|-----------------|
| **Zoopla** | Official API (Hometrack commercial) + manual ingestion | API ready in app; access requires Hometrack agreement |
| **Rightmove** | Manual ingestion only; B2B data product exists (contact Rightmove) | No public API for listing consumption; RTDF is for agents to *upload* |
| **ESPC** | Manual ingestion only | No public API or feed; contact ESPC for partnership |
| **OnTheMarket** | Manual ingestion only | RTDF for agents to *upload*; no public “pull” API |
| **S1homes** | Manual ingestion only | No public API/feed; contact S1homes for partnership |
| **Rettie, Fern/Ferhome, KW Scotland** | Manual ingestion as `source: agent` | No public feeds; agent websites only |

---

## 1. Rightmove

**Website:** https://www.rightmove.co.uk  
**Role:** UK’s largest property portal (~1M residential properties advertised monthly).

### What Rightmove offers (investigation)

- **Real Time Data Feed (RTDF) / Automated Datafeed (ADF)**  
  - **Purpose:** For **estate agents and their software providers** to **upload** properties TO Rightmove (send listings, remove property, get branch property list).  
  - **Not for:** Third-party apps pulling Rightmove listings for display/aggregation.  
  - **Spec:** Real Time Datafeed Specification (e.g. v1.4.1, Nov 2023); EULA applies.  
  - **Access:** Provider contact form + ADF Team: **adfsupport@rightmove.co.uk**; schemas and test environment on request.  
  - **Docs:** https://www.rightmove.co.uk/adf.html

- **Rightmove Property Data / Data Services**  
  - **Purpose:** B2B data product – market intelligence, bespoke analysis, valuations, risk, etc.  
  - **Audience:** Investors, consultants, local authorities, housing associations, surveyors, lenders, agents, developers.  
  - **Data:** Price info, supply/demand, asking prices, rental yields, time on market, etc.; can be combined with Land Registry, planning, flood risk.  
  - **Access:** Contact form – https://www.rightmove.co.uk/property-data/contact-us/

### How we connect

- **Current:** **Manual ingestion only.**  
  - Use `POST /api/v1/ingestion/manual` with `source: "rightmove"` and the Rightmove listing URL.  
  - URL is validated (rightmove.co.uk); source can be auto-detected.  
  - All listings link back via `listing_url`.

- **Future (if needed):**  
  - Enquire with **Rightmove Data Services** (property-data/contact-us) for a B2B data/API product; no public “listing API” exists for consumption.

---

## 2. Zoopla

**Website:** https://www.zoopla.co.uk  
**API/Commercial:** Hometrack (https://www.hometrack.com) – Zoopla’s data/API commercial arm.

### What Zoopla/Hometrack offer (investigation)

- **Listings API (documented but gated)**  
  - **Endpoints (e.g.):** `GET /listing/property/items`, `GET /listing/property/{propertyId}`.  
  - **Auth:** OAuth 2.0 client credentials; token from `https://services-auth.services.zoopla.co.uk`.  
  - **Status:** Not publicly available; **commercial agreement with Hometrack** required.  
  - **Contact:** https://www.hometrack.com/contact-us/

- **Other Hometrack data**  
  - Property comparables, housing market intelligence, site appraisal reports; some offerings as **batch file** delivery rather than live API.

- **Public/agent-facing Zoopla APIs**  
  - **Leads API:** Appraisal/applicant leads for agents (OAuth2).  
  - **Premium Listings API:** Programmatic activation of premium listings in CRM (credits-based).  
  - **Alto API:** For agents using Alto PMS.  
  - **Docs:** https://developers.zoopla.co.uk/

### How we connect

- **API (when you have access):**  
  - Backend is ready: set `ZOOPLA_CLIENT_ID`, `ZOOPLA_CLIENT_SECRET`, `ZOOPLA_ENABLED=true` in backend `.env`.  
  - Admin can call `POST /api/v1/zoopla/sync` to pull listings; they are stored and classified.  
  - See: `docs/zoopla-api-integration.md`, `backend/app/services/zoopla_service.py`, `backend/app/api/v1/zoopla.py`.

- **Manual:**  
  - Any Zoopla listing: `POST /api/v1/ingestion/manual` with zoopla.co.uk URL and `source: zoopla`.  
  - URL validated; source auto-detected.

---

## 3. ESPC (Edinburgh Solicitors Property Centre)

**Website:** https://www.espc.com  
**Role:** Edinburgh and Lothians-focused property centre (solicitor estate agents).

### What ESPC offers (investigation)

- **Public/product:**  
  - Monthly **House Price Reports** (Edinburgh, Lothians, Fife, Scottish Borders): average prices, volumes, time to sell, new supply.  
  - **Sales archive** for solicitor estate agents (recent sales, descriptions).  
  - No documented **public API or data feed** for listing ingestion.

- **Partnership/API:**  
  - No public technical spec for API or feed.  
  - Partnership or data access would require **contacting ESPC directly** (website, or via their solicitor agent network).

### How we connect

- **Current:** **Manual ingestion only.**  
  - Use `source: "espc"` and `listing_url` from espc.com.  
  - URL pattern `espc.com` is recognised; source auto-detected.  
  - Ideal for Edinburgh-focused curation.

- **Future:**  
  - Contact ESPC for any formal data feed or API partnership.

---

## 4. OnTheMarket

**Website:** https://www.onthemarket.com  
**Role:** UK property portal (agent-sourced listings).

### What OnTheMarket offers (investigation)

- **Real-Time Data Feed (RTDF)**  
  - **Purpose:** For **agents/software providers** to **send** properties TO OnTheMarket (same conceptual model as Rightmove RTDF).  
  - **Format:** Compatible with Rightmove-style RTDF; some integrations (e.g. Property Hive) support both Rightmove and OnTheMarket.  
  - **Features (via partners):** Real-time publish/update, lead import (e.g. `realtime-api.onthemarket.com`), exclusivity windows (24/48/72h).  
  - **Not:** A public “pull” API for third parties to consume OnTheMarket’s full listing dataset.

- **No public listing API** for aggregation apps.

### How we connect

- **Current:** **Manual ingestion only.**  
  - Use `source: "onthemarket"` and `listing_url` from onthemarket.com.  
  - URL pattern recognised; source auto-detected.

- **Future:**  
  - Any bulk/API access would require a commercial/partner agreement with OnTheMarket.

---

## 5. S1homes

**Website:** https://www.s1homes.com  
**Role:** Scotland’s largest property website (buy, rent, developments).

### What S1homes offers (investigation)

- **Public:**  
  - Consumer-facing search; agents/developers can **advertise** on S1homes (advertise-estate-letting-agency, advertise-property-developments).  
  - No **public** API or data feed specification found.

- **Partnership/API:**  
  - No documented technical feed/API for third-party listing consumption.  
  - **Contact S1homes directly** (website, partner/developer enquiries) for any data or feed options.

### How we connect

- **Current:** **Manual ingestion only.**  
  - Use `source: "s1homes"` and `listing_url` from s1homes.com.  
  - URL pattern recognised; source auto-detected.  
  - Scottish-focused.

- **Future:**  
  - Contact S1homes for partnership or feed access if required.

---

## 6. Estate agents: Rettie, Fern/Ferhome, KW Scotland

These are **estate agents**, not portals. They list on their own sites and often on Rightmove, Zoopla, OnTheMarket, S1homes, ESPC. We treat them as **agent** sources.

### Rettie

- **Website:** https://www.rettie.co.uk  
- **Coverage:** Scotland (Glasgow, Edinburgh) and North East England.  
- **Offers:** Listings, property research (e.g. Dr John Boyle), market reports.  
- **Data feed/API:** No public API or machine-readable feed; **contact Rettie** for any bespoke data.  
- **In our app:** Use `source: "agent"`, `agent_name: "Rettie"`, `agent_url: "https://www.rettie.co.uk"`, and the listing URL (Rettie or portal).

### Fern / Ferhome

- **Ferhome:** https://www.ferhome.co.uk – independent agency, Helensburgh (opened 2025).  
- “Fern” may refer to Ferhome or another Fern-branded agent; no public API/feed found.  
- **In our app:** Use `source: "agent"`, `agent_name: "Ferhome"` (or "Fern" as appropriate), and the listing URL.

### KW Scotland (Keller Williams Scotland)

- **Website:** https://kwscotland.co.uk  
- **Coverage:** Scotland-wide (Edinburgh, Glasgow, Fife, Highlands, etc.).  
- **Role:** Part of Keller Williams; listings and buyer/seller services.  
- **Data feed/API:** No public API; agent-only.  
- **In our app:** Use `source: "agent"`, `agent_name: "KW Scotland"`, `agent_url: "https://kwscotland.co.uk"`, and the listing URL.

### Generic agent flow

- **source:** `"agent"` (or `"other"` if URL does not match a known portal).  
- **listing_url:** Agent or portal page for the property.  
- **agent_name:** e.g. `"Rettie"`, `"Ferhome"`, `"KW Scotland"`.  
- **agent_url:** Optional; agent’s main website.

---

## How to add a listing (any source)

**Endpoint:** `POST /api/v1/ingestion/manual` (admin/agent role).

**Valid `source` values:**  
`rightmove`, `zoopla`, `espc`, `s1homes`, `onthemarket`, `agent`, `other`.

**Example:**

```json
{
  "listing_url": "https://www.rightmove.co.uk/...",
  "source": "rightmove",
  "address": "123 High Street, Edinburgh",
  "postcode": "EH1 1AA",
  "city": "Edinburgh",
  "price_raw": "Fixed Price £250,000",
  "description": "...",
  "agent_name": "Rettie",
  "agent_url": "https://www.rettie.co.uk"
}
```

If the URL matches a known portal domain, the backend can override `source` to that portal. For agent-only URLs, use `source: "agent"` or `"other"` and set `agent_name` (and optionally `agent_url`).

---

## Where this is implemented

- **Valid sources and URL patterns:**  
  `backend/app/models/ingestion.py`, `backend/app/services/ingestion_service.py`  
  (VALID_SOURCES, URL_PATTERNS, `validate_url`).
- **Manual ingestion:**  
  `backend/app/api/v1/ingestion.py` → `ingestion_service.add_manual_listing`.
- **Zoopla API:**  
  `backend/app/services/zoopla_service.py`, `backend/app/api/v1/zoopla.py`, `backend/app/core/config.py` (ZOOPLA_* env vars).
- **Policies (no scraping, APIs/feeds):**  
  `docs/data-sources-ingestion.md`.

---

## Contact / next steps (for future automation)

| Source | Enquiry / contact |
|--------|--------------------|
| **Rightmove** | Data consumption: Rightmove Data Services – https://www.rightmove.co.uk/property-data/contact-us/ |
| **Rightmove** | ADF/RTDF (upload only): adfsupport@rightmove.co.uk |
| **Zoopla / Listings API** | Hometrack – https://www.hometrack.com/contact-us/ |
| **ESPC** | ESPC website / solicitor agent network – https://www.espc.com |
| **OnTheMarket** | OnTheMarket commercial/partner team (via website) |
| **S1homes** | S1homes website – partner/developer enquiries |
| **Rettie / Fern / KW Scotland** | Agent websites for any bespoke data/partnership |

For now, all non-Zoopla sources are connected via **manual ingestion**; **Zoopla** can use the in-app API when Hometrack access is in place.
