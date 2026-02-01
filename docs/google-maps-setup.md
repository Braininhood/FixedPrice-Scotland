# Google Maps Setup Guide

## Why Google Maps?

After researching map library options (Leaflet, Mapbox, Google Maps), we chose **Google Maps** for the following reasons:

1. **Excellent Geocoding**: Built-in geocoding API converts postcodes/addresses to coordinates
2. **Reliable & Accurate**: Most accurate location data globally
3. **Generous Free Tier**: $200/month credit (covers ~28,000 map loads)
4. **Easy React Integration**: `@react-google-maps/api` provides excellent React components
5. **Production Ready**: Used by millions of applications worldwide

## Setup Instructions

### 1. Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Maps JavaScript API** (for displaying maps)
   - **Geocoding API** (for converting addresses to coordinates)
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy your API key

### 2. Configure API Key Restrictions (Recommended)

For security, restrict your API key:

1. Click on your API key in the credentials page
2. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add your domains:
     - `localhost:*` (for development)
     - `yourdomain.com/*` (for production)
3. Under "API restrictions":
   - Select "Restrict key"
   - Choose: "Maps JavaScript API" and "Geocoding API"
4. Save

### 3. Add to Environment Variables

Add your API key to `frontend/.env.local`:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### 4. Restart Development Server

After adding the API key, restart your Next.js development server:

```bash
npm run dev
```

## Pricing

- **Free Tier**: $200/month credit
- **Maps JavaScript API**: $7 per 1,000 map loads
- **Geocoding API**: $5 per 1,000 requests

With the free tier, you get approximately:
- ~28,000 map loads/month
- ~40,000 geocoding requests/month

This should be more than sufficient for development and initial production use.

## Features Implemented

- ✅ Interactive map with markers
- ✅ Color-coded markers (green=explicit, blue=likely, gray=competitive)
- ✅ Info windows with listing details
- ✅ Auto-fit bounds to show all listings
- ✅ Geocoding (postcode/address → coordinates)
- ✅ Responsive design
- ✅ Toggle between list and map view

## Troubleshooting

### Map not loading
- Check that `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set in `.env.local`
- Verify the API key is correct
- Check browser console for errors
- Ensure Maps JavaScript API is enabled in Google Cloud Console

### Geocoding not working
- Verify Geocoding API is enabled
- Check API key restrictions allow Geocoding API
- Review browser console for quota/error messages

### Markers not showing
- Check that listings have postcode or address data
- Review browser console for geocoding errors
- Verify network requests in browser DevTools

## Alternative: Using Leaflet (Free)

If you prefer a completely free solution, you can switch to Leaflet:

1. Install: `npm install leaflet react-leaflet @types/leaflet`
2. Use a free geocoding service (e.g., Nominatim/OpenStreetMap)
3. Replace `ListingsMap.tsx` with Leaflet implementation

However, Google Maps provides better accuracy and reliability for production use.
