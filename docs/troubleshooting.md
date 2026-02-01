# Troubleshooting Guide

## Common Issues and Solutions

### 1. Cross-Origin Request Warnings

**Warning**: `Blocked cross-origin request from 127.0.0.1 to /_next/* resource`

**Solution**: 
- The `allowedDevOrigins` is already configured in `next.config.ts`
- **Restart the Next.js dev server** for changes to take effect:
  ```bash
  # Stop the current server (Ctrl+C)
  npm run dev
  ```

**Configuration Location**: `frontend/next.config.ts`

### 2. CORS Errors from Backend

**Error**: `CORS header 'Access-Control-Allow-Origin' missing`

**Solution**:
- Check that backend server is running: `python main.py`
- Verify CORS origins in `backend/app/core/config.py` include:
  - `http://localhost:3000`
  - `http://127.0.0.1:3000`
- Restart backend server after config changes

### 3. Multiple Supabase Client Instances

**Warning**: `Multiple GoTrueClient instances detected`

**Solution**: 
- Fixed with singleton pattern in `frontend/src/lib/supabase.ts`
- If warning persists, clear browser cache and restart dev server

### 4. SelectItem Empty Value Error

**Error**: `A <Select.Item /> must have a value prop that is not an empty string`

**Solution**: 
- Fixed: Changed empty string values to `"all"` in Select components
- All SelectItem components now have non-empty values

### 5. Hydration Errors

**Error**: `A tree hydrated but some attributes didn't match`

**Solution**:
- Usually caused by browser extensions (Grammarly, etc.)
- Fixed with `suppressHydrationWarning` on `<body>` tag
- This is safe and expected for extension-injected attributes

### 6. API Network Errors

**Error**: `API Network Error: Connection failed`

**Solution**:
- Ensure backend is running: `cd backend && python main.py`
- Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local`
- Verify backend is accessible at `http://localhost:8000`

### 7. OAuth Provider Not Enabled

**Error**: `Unsupported provider: provider is not enabled`

**Solution**:
- This is expected if OAuth providers aren't configured in Supabase
- Use email/password authentication (works without setup)
- To enable OAuth, follow `docs/supabase-oauth-setup.md`

## Quick Fixes

### Restart Servers
```bash
# Frontend
cd frontend
npm run dev

# Backend (in separate terminal)
cd backend
.\venv\Scripts\activate
python main.py
```

### Clear Browser Cache
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Or clear browser cache completely

### Check Environment Variables
- Frontend: `frontend/.env.local`
- Backend: `backend/.env`

### Verify Ports
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

## Still Having Issues?

1. Check browser console for specific error messages
2. Check terminal output for backend errors
3. Verify all environment variables are set correctly
4. Ensure both frontend and backend servers are running
5. Try accessing the site via `localhost:3000` instead of `127.0.0.1:3000`
