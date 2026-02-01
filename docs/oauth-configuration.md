# OAuth Configuration Summary

## Supabase OAuth Settings

### URL Configuration
- **Site URL**: `http://localhost:3000` (for development)
- **Authorization Path**: `/oauth/consent`
- **Preview Authorization URL**: `http://localhost:3000/oauth/consent`
- **Callback URL (for OAuth)**: `https://oyqzmcsmigpekhmlzhoz.supabase.co/auth/v1/callback`

### Implementation Status

✅ **OAuth Consent Page**: Implemented at `/app/oauth/consent/page.tsx`
- Handles OAuth code exchange
- Processes authorization errors
- Redirects to `/auth/callback` after successful authentication

✅ **OAuth Redirect URLs Updated**:
- Login page: Redirects to `/oauth/consent`
- Signup page: Redirects to `/oauth/consent`

✅ **Auth Callback Page**: Updated to redirect to `/account` after authentication

## OAuth Flow

1. **User clicks OAuth button** (Google/Facebook)
   - Location: `/auth/login` or `/auth/signup`
   - Action: `supabase.auth.signInWithOAuth()` called

2. **Redirect to OAuth Provider**
   - User is redirected to Google/Facebook login page
   - User authorizes the application

3. **Provider Redirects to Supabase**
   - Provider redirects to: `https://oyqzmcsmigpekhmlzhoz.supabase.co/auth/v1/callback`
   - Supabase processes the OAuth response

4. **Supabase Redirects to App**
   - Supabase redirects to: `http://localhost:3000/oauth/consent?code=...`
   - Our consent page receives the authorization code

5. **Code Exchange**
   - `/oauth/consent` page calls `supabase.auth.exchangeCodeForSession(code)`
   - Session is created and stored

6. **Final Redirect**
   - User is redirected to `/auth/callback`
   - Then to `/account` dashboard

## Files Modified

1. **`frontend/src/app/oauth/consent/page.tsx`** (NEW)
   - OAuth consent handler
   - Code exchange logic
   - Error handling

2. **`frontend/src/app/auth/login/page.tsx`**
   - Updated `redirectTo` to `/oauth/consent`

3. **`frontend/src/app/auth/signup/page.tsx`**
   - Updated `redirectTo` to `/oauth/consent`

4. **`frontend/src/app/auth/callback/page.tsx`**
   - Updated redirect to `/account` instead of `/dashboard`

## Next Steps to Enable OAuth

1. **Enable OAuth Providers in Supabase Dashboard**:
   - Go to: Authentication → Providers
   - Enable Google and/or Facebook
   - Add Client ID and Secret

2. **Configure Google OAuth** (if using Google):
   - Add redirect URI: `https://oyqzmcsmigpekhmlzhoz.supabase.co/auth/v1/callback`
   - Copy credentials to Supabase

3. **Test OAuth Flow**:
   - Click OAuth button on login/signup page
   - Should redirect through provider → Supabase → `/oauth/consent` → `/account`

## Production Configuration

When deploying to production, update:

1. **Supabase Dashboard**:
   - Site URL: `https://yourdomain.com`
   - Authorization Path: `/oauth/consent` (same)

2. **Environment Variables**:
   - Update `NEXT_PUBLIC_SUPABASE_URL` if needed
   - Update `NEXT_PUBLIC_SUPABASE_ANON_KEY` if needed

3. **OAuth Provider Settings**:
   - Add production redirect URIs
   - Update authorized domains

## Troubleshooting

- **"Provider not enabled"**: Enable the provider in Supabase Dashboard
- **"Redirect URI mismatch"**: Check redirect URIs match exactly
- **Code exchange fails**: Check that authorization path is correctly set in Supabase
- **Session not created**: Verify OAuth provider credentials are correct
