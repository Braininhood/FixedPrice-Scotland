# Zoopla API Setup Instructions

## Overview

This guide provides step-by-step instructions for setting up Zoopla API integration in the FixedPrice Scotland application.

---

## Prerequisites

1. **Commercial Agreement**: Zoopla listings API requires a commercial agreement with Hometrack
2. **Contact Hometrack**: https://www.hometrack.com/contact-us/
3. **API Credentials**: You will receive `client_id` and `client_secret` after agreement

---

## Step 1: Contact Hometrack for API Access

### Contact Information
- **Website**: https://www.hometrack.com/contact-us/
- **Alternative**: Contact your Zoopla account manager (if you have one)

### What to Request
1. Access to Zoopla Listings API
2. Commercial terms and pricing
3. API credentials (client_id and client_secret)
4. API documentation and rate limits
5. Support contact information

### Expected Timeline
- Initial contact: 1-2 business days
- Agreement negotiation: 1-2 weeks
- Credentials provided: After agreement signed

---

## Step 2: Configure Environment Variables

Once you receive API credentials, add them to your `.env` file:

```bash
# Zoopla API Configuration
ZOOPLA_CLIENT_ID=your_client_id_here
ZOOPLA_CLIENT_SECRET=your_client_secret_here
ZOOPLA_AUDIENCE=https://services.zoopla.co.uk
ZOOPLA_BASE_URL=https://services.zoopla.co.uk
ZOOPLA_AUTH_URL=https://services-auth.services.zoopla.co.uk/oauth2/token
ZOOPLA_ENABLED=true
```

### Security Notes
- ⚠️ **Never commit `.env` file to git**
- ✅ Add `.env` to `.gitignore`
- ✅ Use environment-specific values for production
- ✅ Rotate credentials if compromised

---

## Step 3: Test Authentication

### Via API Endpoint

```bash
# Test authentication
curl -X POST http://localhost:8000/api/v1/zoopla/test-auth \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Expected response when configured:
```json
{
  "success": true,
  "message": "Zoopla API authentication successful",
  "token_obtained": true,
  "token_length": 1234,
  "configured": true
}
```

### Via Python Script

```python
from app.services.zoopla_auth import zoopla_auth_service
import asyncio

async def test():
    token = await zoopla_auth_service.get_access_token()
    if token:
        print("✅ Authentication successful")
        print(f"Token length: {len(token)}")
    else:
        print("❌ Authentication failed")

asyncio.run(test())
```

---

## Step 4: Sync Listings

### Manual Sync via API

```bash
# Sync listings from Zoopla
curl -X POST "http://localhost:8000/api/v1/zoopla/sync?limit=50&postcode=EH1" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Parameters
- `postcode`: Filter by postcode (optional)
- `min_price`: Minimum price filter (optional)
- `max_price`: Maximum price filter (optional)
- `limit`: Maximum listings to sync (1-100, default: 50)

### Response
```json
{
  "message": "Zoopla listings synced successfully",
  "success": true,
  "processed": 50,
  "added": 45,
  "updated": 5,
  "errors": 0,
  "errors_list": []
}
```

---

## Step 5: Set Up Automated Sync (Optional)

### Scheduled Job

Create a scheduled task to sync listings regularly:

```python
# Example: backend/app/jobs/zoopla_sync_job.py
import asyncio
from app.services.zoopla_service import zoopla_service

async def sync_zoopla_listings():
    """Scheduled job to sync Zoopla listings."""
    results = await zoopla_service.sync_listings(limit=100)
    print(f"Synced {results['added']} new listings, {results['updated']} updated")
    return results

# Run daily at 2 AM
# Use cron, Celery, or similar task scheduler
```

### Using Celery (Recommended)

```python
from celery import Celery
from app.services.zoopla_service import zoopla_service

celery_app = Celery('fixedprice_scotland')

@celery_app.task
def sync_zoopla_listings_task():
    """Celery task to sync Zoopla listings."""
    import asyncio
    return asyncio.run(zoopla_service.sync_listings(limit=100))
```

---

## Step 6: Monitor Integration

### Check Status

```bash
# Get Zoopla API status
curl http://localhost:8000/api/v1/zoopla/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Monitor Logs

Watch for:
- Authentication errors
- Rate limit errors (429)
- API errors
- Sync failures

### Metrics to Track
- Number of listings synced
- Sync success rate
- API error rate
- Rate limit occurrences

---

## Troubleshooting

### Authentication Fails

**Problem**: `token_obtained: false`

**Solutions**:
1. Verify `ZOOPLA_CLIENT_ID` and `ZOOPLA_CLIENT_SECRET` are correct
2. Check credentials haven't expired
3. Verify `ZOOPLA_ENABLED=true` in `.env`
4. Contact Hometrack if credentials are invalid

### Rate Limit Errors (429)

**Problem**: Receiving 429 Too Many Requests

**Solutions**:
1. Implement token caching (already done)
2. Reduce sync frequency
3. Add delays between requests
4. Contact Hometrack about rate limits

### No Listings Returned

**Problem**: Sync returns 0 listings

**Solutions**:
1. Check filters aren't too restrictive
2. Verify API endpoint is correct
3. Check API response format matches expectations
4. Review API documentation for changes

### Mapping Errors

**Problem**: Listings fail to map to our schema

**Solutions**:
1. Review Zoopla API response format
2. Update `_map_zoopla_listing()` method
3. Add logging to see raw API responses
4. Check field definitions in API docs

---

## API Endpoints Reference

### Status Endpoint
- **GET** `/api/v1/zoopla/status`
- **Purpose**: Check Zoopla API configuration and status
- **Auth**: Admin only

### Test Auth Endpoint
- **POST** `/api/v1/zoopla/test-auth`
- **Purpose**: Test OAuth2 authentication
- **Auth**: Admin only

### Sync Endpoint
- **POST** `/api/v1/zoopla/sync`
- **Purpose**: Sync listings from Zoopla API
- **Auth**: Admin only
- **Parameters**: `postcode`, `min_price`, `max_price`, `limit`

---

## Best Practices

### 1. Token Management
- ✅ Cache tokens for full expiry duration
- ✅ Only refresh when expired
- ✅ Handle token refresh errors gracefully

### 2. Rate Limiting
- ✅ Respect API rate limits
- ✅ Implement exponential backoff
- ✅ Monitor for 429 errors

### 3. Error Handling
- ✅ Log all API errors
- ✅ Retry transient failures
- ✅ Alert on persistent failures

### 4. Data Quality
- ✅ Validate mapped data
- ✅ Check for duplicates
- ✅ Handle missing fields gracefully

### 5. Security
- ✅ Never expose credentials
- ✅ Use environment variables
- ✅ Rotate credentials regularly

---

## Support Resources

### Zoopla Documentation
- **Leads API**: https://developers.zoopla.co.uk/docs/leads-rest-api
- **API Reference**: https://developers.zoopla.co.uk/reference
- **Field Definitions**: https://developers.zoopla.co.uk/docs/field-definitions

### Contact
- **Hometrack**: https://www.hometrack.com/contact-us/
- **Zoopla Leads Team**: For Leads API inquiries
- **Your Account Manager**: For commercial agreements

---

## Next Steps

1. ✅ Contact Hometrack for API access
2. ✅ Configure environment variables
3. ✅ Test authentication
4. ✅ Sync initial listings
5. ✅ Set up automated sync (optional)
6. ✅ Monitor integration health

---

## Version History

- **v1.0** (2026-01-24): Initial Zoopla API setup instructions
  - Contact information
  - Configuration steps
  - Testing procedures
  - Troubleshooting guide
