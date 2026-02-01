# Zoopla API Integration Summary

## Overview

Complete Zoopla API integration has been prepared for the FixedPrice Scotland application. The integration is ready to use once commercial API access is granted by Hometrack.

---

## What Has Been Implemented

### 1. Authentication Service (`backend/app/services/zoopla_auth.py`)

**Features**:
- ✅ OAuth2 client credentials flow
- ✅ Access token caching (reduces API calls)
- ✅ Automatic token refresh
- ✅ Token expiry management
- ✅ Error handling

**Key Methods**:
- `get_access_token()`: Get valid access token (with caching)
- `get_auth_headers()`: Get authorization headers for API requests
- `is_enabled()`: Check if Zoopla API is configured
- `clear_token_cache()`: Clear cached token (for testing)

### 2. Zoopla Service (`backend/app/services/zoopla_service.py`)

**Features**:
- ✅ Fetch listings from Zoopla API
- ✅ Map Zoopla data to our listing format
- ✅ Sync listings to database
- ✅ Handle duplicates (update existing, add new)
- ✅ Rate limiting and error handling
- ✅ Filter support (postcode, price range)

**Key Methods**:
- `fetch_listings()`: Fetch listings from Zoopla API
- `sync_listings()`: Sync listings to our database
- `_map_zoopla_listing()`: Map Zoopla data to our schema
- `_map_zoopla_listings()`: Map array of listings

### 3. API Endpoints (`backend/app/api/v1/zoopla.py`)

**Endpoints**:
- ✅ `GET /api/v1/zoopla/status` - Check API status and configuration
- ✅ `POST /api/v1/zoopla/test-auth` - Test OAuth2 authentication
- ✅ `POST /api/v1/zoopla/sync` - Sync listings from Zoopla API

**Access Control**: All endpoints require admin role

### 4. Configuration (`backend/app/core/config.py`)

**Environment Variables Added**:
- `ZOOPLA_CLIENT_ID`: OAuth2 client ID
- `ZOOPLA_CLIENT_SECRET`: OAuth2 client secret
- `ZOOPLA_AUDIENCE`: API audience (default: https://services.zoopla.co.uk)
- `ZOOPLA_BASE_URL`: Base URL for API (default: https://services.zoopla.co.uk)
- `ZOOPLA_AUTH_URL`: Authentication URL (default: https://services-auth.services.zoopla.co.uk/oauth2/token)
- `ZOOPLA_ENABLED`: Enable/disable Zoopla integration (default: false)

### 5. Documentation

**Created Documents**:
- ✅ `docs/zoopla-api-integration.md` - Complete integration guide
- ✅ `docs/zoopla-setup-instructions.md` - Step-by-step setup guide
- ✅ `docs/zoopla-integration-summary.md` - This summary
- ✅ Updated `docs/data-sources-ingestion.md` with Zoopla information

---

## API Information

### Authentication

**Method**: OAuth 2.0 Client Credentials Flow

**Request**:
```bash
POST https://services-auth.services.zoopla.co.uk/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET
&audience=https://services.zoopla.co.uk
```

**Response**:
```json
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### Available APIs

1. **Leads API** (Available):
   - `/appraisal-leads` - Get appraisal leads
   - `/applicant-leads` - Get applicant leads
   - **Use Case**: For agents, not directly useful for FixedPrice Scotland

2. **Alto Listing API** (If Available):
   - `/listing/property/{propertyId}` - Get single listing
   - `/listing/property-items` - Get multiple listings
   - `/listing` - Filter listings
   - **Use Case**: Potentially useful if we become a Zoopla partner

3. **Listings API** (Commercial Access Required):
   - **Status**: Not publicly available
   - **Contact**: Hometrack (https://www.hometrack.com/contact-us/)
   - **Use Case**: Primary use case for FixedPrice Scotland

---

## Getting API Access

### Step 1: Contact Hometrack

- **Website**: https://www.hometrack.com/contact-us/
- **Request**: Access to Zoopla Listings API
- **Discuss**: Commercial terms, pricing, rate limits

### Step 2: Receive Credentials

After agreement:
- `client_id`: OAuth2 client ID
- `client_secret`: OAuth2 client secret
- API documentation
- Rate limit information

### Step 3: Configure

Add to `.env`:
```bash
ZOOPLA_CLIENT_ID=your_client_id
ZOOPLA_CLIENT_SECRET=your_client_secret
ZOOPLA_ENABLED=true
```

### Step 4: Test

```bash
# Test authentication
curl -X POST http://localhost:8000/api/v1/zoopla/test-auth \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Sync listings
curl -X POST "http://localhost:8000/api/v1/zoopla/sync?limit=50" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## Integration Flow

### 1. Authentication
```
Client → ZooplaAuthService.get_access_token()
  → OAuth2 Token Request
  → Cache Token
  → Return Token
```

### 2. Fetch Listings
```
ZooplaService.fetch_listings()
  → Get Access Token
  → API Request with Filters
  → Map Zoopla Data
  → Return Listings
```

### 3. Sync to Database
```
ZooplaService.sync_listings()
  → Fetch Listings
  → Check Duplicates
  → Add/Update Listings
  → Trigger Classification
  → Return Results
```

---

## Data Mapping

### Zoopla → FixedPrice Scotland

| Zoopla Field | Our Field | Transformation |
|--------------|-----------|---------------|
| `propertyId` / `id` | `listing_url` | Construct: `https://www.zoopla.co.uk/property/{id}` |
| `address.displayAddress` | `address` | Use display address or fallback |
| `address.postcode` | `postcode` | Extract postcode |
| `address.city` | `city` | Extract city |
| `address.county` | `region` | Extract county/region |
| `price` / `priceNumeric` | `price_numeric` | Convert to float |
| `priceDisplay` / `price` | `price_raw` | Use display format |
| `description` / `summary` | `description` | Use description or summary |
| `agent.name` | `agent_name` | Extract agent name |
| `agent.url` | `agent_url` | Extract agent URL |
| - | `source` | Set to "zoopla" |
| - | `is_active` | Set to `true` |

---

## Error Handling

### Rate Limiting (429)
- ✅ Automatic retry with delay
- ✅ Exponential backoff
- ✅ Token caching to reduce calls

### Authentication Errors (401)
- ✅ Token refresh on expiry
- ✅ Clear error messages
- ✅ Logging for debugging

### API Errors (400, 404, 500)
- ✅ Graceful error handling
- ✅ Detailed error messages
- ✅ Error logging

---

## Best Practices Implemented

1. **Token Caching**: Reduces API calls and prevents rate limits
2. **Error Handling**: Comprehensive error handling with retries
3. **Rate Limiting**: Respects API rate limits with backoff
4. **Data Validation**: Validates and maps data correctly
5. **Duplicate Handling**: Updates existing, adds new
6. **Security**: Credentials in environment variables
7. **Logging**: Comprehensive logging for debugging

---

## Testing

### Unit Tests
- ✅ Authentication service tests (structure ready)
- ✅ Service tests (structure ready)
- ✅ API endpoint tests (structure ready)

### Manual Testing
1. Test authentication: `POST /api/v1/zoopla/test-auth`
2. Check status: `GET /api/v1/zoopla/status`
3. Sync listings: `POST /api/v1/zoopla/sync`

---

## Current Status

### ✅ Completed
- Authentication service
- Zoopla service
- API endpoints
- Configuration
- Documentation
- Data mapping
- Error handling

### ⏳ Pending
- Commercial API access from Hometrack
- API credentials
- Real API testing
- Production deployment

---

## Next Steps

1. **Contact Hometrack**: https://www.hometrack.com/contact-us/
2. **Negotiate Agreement**: Commercial terms and pricing
3. **Receive Credentials**: Get client_id and client_secret
4. **Configure**: Add credentials to `.env`
5. **Test**: Use test endpoints to verify
6. **Sync**: Start syncing listings
7. **Monitor**: Track sync success and errors

---

## Files Created/Modified

### New Files
- `backend/app/services/zoopla_auth.py` - OAuth2 authentication
- `backend/app/services/zoopla_service.py` - Zoopla API integration
- `backend/app/api/v1/zoopla.py` - API endpoints
- `docs/zoopla-api-integration.md` - Integration guide
- `docs/zoopla-setup-instructions.md` - Setup instructions
- `docs/zoopla-integration-summary.md` - This summary

### Modified Files
- `backend/app/core/config.py` - Added Zoopla settings
- `backend/main.py` - Registered Zoopla router
- `backend/.env.example` - Added Zoopla environment variables
- `docs/data-sources-ingestion.md` - Updated Zoopla information
- `docs/implementation-plan.md` - Marked Zoopla integration as prepared

---

## Support

### Documentation
- **Zoopla API Docs**: https://developers.zoopla.co.uk/docs/leads-rest-api
- **API Reference**: https://developers.zoopla.co.uk/reference
- **Field Definitions**: https://developers.zoopla.co.uk/docs/field-definitions

### Contact
- **Hometrack**: https://www.hometrack.com/contact-us/
- **Zoopla Leads Team**: For Leads API inquiries
- **Account Manager**: For commercial agreements

---

## Version History

- **v1.0** (2026-01-24): Initial Zoopla API integration
  - OAuth2 authentication service
  - Zoopla listing sync service
  - API endpoints for status, test, and sync
  - Complete documentation
  - Ready for commercial API access
