# Supabase OAuth Provider Setup

## Error: "Unsupported provider: provider is not enabled"

This error occurs when trying to use OAuth authentication (Google, Facebook, etc.) but the provider hasn't been enabled in your Supabase project.

## Solution: Enable OAuth Providers in Supabase

### Steps to Enable OAuth Providers:

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project: `FixedPrice-Scotland`

2. **Open Authentication Settings**
   - Go to: **Authentication** → **Providers**

3. **Enable Google OAuth** (Recommended for estate web apps)
   - Click on **Google**
   - Toggle **Enable Google provider**
   - You'll need:
     - **Google Client ID** (from Google Cloud Console)
     - **Google Client Secret** (from Google Cloud Console)
   - **Site URL**: `http://localhost:3000` (for development)
   - **Authorization Path**: `/oauth/consent`
   - **Callback URL**: `https://oyqzmcsmigpekhmlzhoz.supabase.co/auth/v1/callback`

4. **Enable Facebook OAuth** (Optional)
   - Click on **Facebook**
   - Toggle **Enable Facebook provider**
   - You'll need:
     - **Facebook App ID**
     - **Facebook App Secret**
   - Add **Redirect URL**: `https://yourdomain.com/auth/callback`

### Getting Google OAuth Credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API** (or **Google Identity API**)
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs:
   - `https://oyqzmcsmigpekhmlzhoz.supabase.co/auth/v1/callback` (Supabase callback)
   - `http://localhost:3000/oauth/consent` (for local development)
7. Copy **Client ID** and **Client Secret** to Supabase

### Getting Facebook OAuth Credentials:

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add **Facebook Login** product
4. Settings → Basic:
   - Add **Valid OAuth Redirect URIs**: `https://oyqzmcsmigpekhmlzhoz.supabase.co/auth/v1/callback`
5. Copy **App ID** and **App Secret** to Supabase

## Alternative: Use Email/Password Only

If you don't want to set up OAuth providers right now, you can:

1. **Remove OAuth buttons** from login/signup pages (optional)
2. **Use email/password authentication only** - this works without any additional setup
3. **Enable OAuth later** when ready

The application will work perfectly fine with just email/password authentication. OAuth is optional and mainly provides convenience for users.

## Current Configuration

- **Site URL**: `http://localhost:3000` (for development)
- **Authorization Path**: `/oauth/consent`
- **Callback URL**: `https://oyqzmcsmigpekhmlzhoz.supabase.co/auth/v1/callback`
- **OAuth Consent Page**: Implemented at `/app/oauth/consent/page.tsx`

## Current Status

- ✅ Email/Password authentication: **Working**
- ✅ OAuth Consent Page: **Implemented** (`/oauth/consent`)
- ⚠️ Google OAuth: **Not enabled** (needs provider configuration in Supabase)
- ⚠️ Facebook OAuth: **Not enabled** (needs provider configuration in Supabase)

## Testing

After enabling OAuth providers:
1. Restart your Next.js dev server
2. Try clicking the "Google" or "Facebook" buttons on login/signup pages
3. You should be redirected to the OAuth provider's login page

## Troubleshooting

- **"Redirect URI mismatch"**: Make sure the redirect URI in Supabase matches exactly with what's configured in Google/Facebook
- **"Invalid client"**: Double-check that Client ID and Secret are correct
- **Still getting errors**: Clear browser cache and try again
