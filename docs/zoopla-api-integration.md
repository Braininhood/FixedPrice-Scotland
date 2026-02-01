# Zoopla API Integration Guide

## Overview

This document provides comprehensive information about integrating Zoopla's APIs into the FixedPrice Scotland application. **Note**: Zoopla's listings API is not publicly available and requires a commercial agreement with Hometrack.

---

## API Access Status

### Current Status (2026)

- **Listings API**: ❌ **Not publicly available** - requires commercial agreement
- **Leads API**: ✅ Available for agents (OAuth2 authentication)
- **Alto API**: ✅ Available for agents using Alto property management system

### Getting API Access

To obtain Zoopla API access for property listings:

1. **Contact Hometrack**: https://www.hometrack.com/contact-us/
2. **Contact Zoopla Directly**: Speak with your Zoopla account manager
3. **Commercial Agreement**: API access requires a commercial partnership
4. **Fees**: Based on your existing contract with Zoopla

---

## Available Zoopla APIs

### 1. Leads API (Available)

**Purpose**: For agents to retrieve leads (appraisal and applicant leads)

**Endpoints**:
- `GET /appraisal-leads` - Retrieve appraisal leads
- `GET /applicant-leads` - Retrieve applicant leads

**Authentication**: OAuth2 with client credentials flow

**Base URL**: `https://services.zoopla.co.uk`

**Use Case**: Not directly useful for FixedPrice Scotland (we need listings, not leads)

**Documentation**: https://developers.zoopla.co.uk/docs/leads-rest-api

---

### 2. Alto Listing API (If Available)

**Purpose**: Property listing data for agents using Alto

**Endpoints** (from API reference):
- `GET /listing/property/{propertyId}` - Get a property listing
- `GET /listing/property-items` - Get multiple property listings
- `GET /listing` - Filter property listings

**Authentication**: OAuth2 with client credentials flow

**Base URL**: `https://services.zoopla.co.uk`

**Use Case**: Potentially useful if we become a Zoopla partner agent

**Documentation**: https://developers.zoopla.co.uk/reference

---

### 3. Listings API (Commercial Access Required)

**Purpose**: Access to Zoopla property listings data

**Status**: **Not publicly available** - requires commercial agreement

**Contact**: Hometrack (https://www.hometrack.com/contact-us/)

**Use Case**: Primary use case for FixedPrice Scotland

---

## Authentication

### OAuth 2.0 Client Credentials Flow

Zoopla APIs use OAuth 2.0 with machine-to-machine authentication.

#### Step 1: Get Access Token

```bash
curl --request POST \
  --url https://services-auth.services.zoopla.co.uk/oauth2/token \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data grant_type=client_credentials \
  --data client_id=YOUR_CLIENT_ID \
  --data client_secret=YOUR_CLIENT_SECRET \
  --data audience=https://services.zoopla.co.uk
```

#### Step 2: Use Access Token

```bash
curl --request GET \
  --url https://services.zoopla.co.uk/api/endpoint \
  --header 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

#### Token Management

- **Token Expiry**: Access tokens have an expiry time
- **Caching**: Cache tokens for their full expiry time
- **Best Practice**: Only request new token when old one expires
- **Rate Limiting**: Reduces API calls and prevents 429 errors

---

## Integration Architecture

### Service Structure

```
backend/app/services/
├── zoopla_service.py          # Main Zoopla integration service
├── zoopla_auth.py             # OAuth2 authentication handler
└── zoopla_models.py           # Pydantic models for Zoopla data
```

### API Endpoints

```
backend/app/api/v1/
└── zoopla.py                  # Zoopla-specific endpoints (if needed)
```

---

## Implementation Plan

### Phase 1: Preparation (Current)

1. ✅ Document Zoopla API requirements
2. ✅ Create service structure
3. ✅ Implement OAuth2 authentication handler
4. ⏳ Contact Hometrack for commercial access
5. ⏳ Negotiate API access terms

### Phase 2: Integration (When Access Granted)

1. Implement listing data fetching
2. Map Zoopla data to our listing model
3. Implement rate limiting and error handling
4. Add sync job for regular updates
5. Test with real data

### Phase 3: Production

1. Deploy integration
2. Monitor API usage
3. Handle rate limits gracefully
4. Update listings regularly

---

## Rate Limiting & Best Practices

### Rate Limiting

- **429 Errors**: Service may return 429 when busy
- **Retry Strategy**: Wait and retry after receiving 429
- **Token Caching**: Cache access tokens to reduce requests
- **Polling**: Default returns last 24 hours; can filter by time period

### Best Practices

1. **Token Management**:
   - Cache tokens for full expiry duration
   - Only refresh when expired
   - Store tokens securely

2. **Error Handling**:
   - Handle 429 errors gracefully
   - Implement exponential backoff
   - Log errors for monitoring

3. **Data Filtering**:
   - Use query parameters to filter by time period
   - Filter by branch/brand/company if applicable
   - Only fetch necessary data

4. **Data Retention**:
   - Leads retained for 30 days
   - Default returns last 24 hours
   - Use filters to get historical data

---

## Data Mapping

### Zoopla → FixedPrice Scotland

When API access is obtained, map Zoopla fields to our schema:

| Zoopla Field | Our Field | Notes |
|--------------|-----------|-------|
| `propertyId` | `listing_url` | Construct URL from propertyId |
| `address` | `address` | Full address |
| `postcode` | `postcode` | UK postcode |
| `price` | `price_numeric` | Numeric price |
| `priceDisplay` | `price_raw` | Display price text |
| `description` | `description` | Property description |
| `agentName` | `agent_name` | Estate agent name |
| `agentUrl` | `agent_url` | Agent website |
| `source` | `source` | Set to "zoopla" |

---

## Configuration

### Environment Variables

Add to `.env`:

```bash
# Zoopla API Configuration (when access is granted)
ZOOPLA_CLIENT_ID=your_client_id
ZOOPLA_CLIENT_SECRET=your_client_secret
ZOOPLA_AUDIENCE=https://services.zoopla.co.uk
ZOOPLA_BASE_URL=https://services.zoopla.co.uk
ZOOPLA_AUTH_URL=https://services-auth.services.zoopla.co.uk/oauth2/token
ZOOPLA_ENABLED=false  # Set to true when API access is granted
```

---

## Error Handling

### Common Errors

1. **429 Too Many Requests**:
   - Wait and retry
   - Implement exponential backoff
   - Check token caching

2. **401 Unauthorized**:
   - Token expired or invalid
   - Refresh access token
   - Verify credentials

3. **400 Bad Request**:
   - Invalid parameters
   - Check request format
   - Verify field definitions

4. **404 Not Found**:
   - Resource doesn't exist
   - Check property ID
   - Verify endpoint URL

---

## Field Definitions

Zoopla provides exhaustive field definitions. Refer to:
- **Field Definitions**: https://developers.zoopla.co.uk/docs/field-definitions
- **API Reference**: https://developers.zoopla.co.uk/reference

---

## Contact & Support

### Zoopla Leads Team
- For Leads API inquiries: Contact Zoopla Leads Team
- Documentation: https://developers.zoopla.co.uk/docs/leads-rest-api

### Hometrack (Listings API)
- For commercial listings API access: https://www.hometrack.com/contact-us/
- Discuss data partnerships and access options

### Zoopla Account Manager
- For existing Zoopla customers: Speak with your account manager
- For API terms and pricing: Based on existing contract

---

## Implementation Notes

### Current Status

- ✅ **Documentation**: Complete
- ✅ **Service Structure**: Prepared
- ⏳ **API Access**: Requires commercial agreement
- ⏳ **Integration Code**: Ready to implement when access granted

### Next Steps

1. **Contact Hometrack** for listings API access
2. **Negotiate Terms** and pricing
3. **Obtain Credentials** (client_id, client_secret)
4. **Implement Integration** using prepared service structure
5. **Test** with real data
6. **Deploy** to production

---

## Alternative Solutions

### Third-Party Services

**PropAPIS** (https://propapis.com):
- Provides Zoopla data extraction
- 90+ data fields
- **Note**: This is scraping-based - **NOT RECOMMENDED** per our no-scraping policy

### Manual Curation

- Continue with manual listing entry (current MVP approach)
- High-quality, curated listings
- No API dependencies
- Full control over data

---

## Version History

- **v1.0** (2026-01-24): Initial Zoopla API integration documentation
  - Documented API access requirements
  - Created service structure
  - Documented authentication process
  - Added rate limiting best practices
  - Prepared for commercial access negotiation
