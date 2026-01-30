import axios, { type AxiosInstance } from 'axios';
import { supabase } from '@/lib/supabase';

/** API base URL: same-origin in browser when on HTTPS to avoid mixed content; env only when safe. */
function getBaseURL(): string {
  const envUrl = typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || '').trim() : '';
  const inBrowser = typeof window !== 'undefined';
  const pageHttps = inBrowser && window.location?.protocol === 'https:';

  if (envUrl) {
    // Never use an HTTP API URL when the page is HTTPS (mixed content blocked by browser).
    const envIsHttp = /^http:\/\//i.test(envUrl);
    if (inBrowser && pageHttps && envIsHttp) {
      // Use same-origin so Nginx can proxy /api/v1 to the backend.
      return '/api/v1';
    }
    const base = envUrl.replace(/\/api\/v1\/?$/, '');
    return base ? `${base}/api/v1` : envUrl;
  }
  if (inBrowser) {
    // Same-origin: Nginx proxies /api/v1 and /health to backend.
    return '/api/v1';
  }
  return '';
}

const apiClient: AxiosInstance = axios.create({
  baseURL: getBaseURL() || undefined,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const url = getBaseURL();
  if (url) config.baseURL = url;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch {
    // no session
  }
  return config;
});

/**
 * Base API origin (no path). When using same-origin /api/v1, returns window.location.origin.
 */
export function getApiOrigin(): string {
  const base = getBaseURL();
  if (!base) return '';
  if (base.startsWith('/')) {
    return typeof window !== 'undefined' ? window.location.origin : '';
  }
  try {
    const u = new URL(base);
    return u.origin;
  } catch {
    return base.replace(/\/api\/v1\/?$/, '') || '';
  }
}

/**
 * Check backend health (GET /health). Uses /health when same-origin so Nginx can proxy.
 */
export async function checkApiHealth(): Promise<{ ok: boolean }> {
  const base = getBaseURL();
  const origin = getApiOrigin();
  if (!origin && !base?.startsWith('/')) return { ok: false };
  const healthUrl = base.startsWith('/') ? '/health' : `${origin}/health`;
  try {
    const res = await fetch(healthUrl, { method: 'GET', cache: 'no-store' });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}

/**
 * Normalize API error detail to a string (FastAPI returns string, list, or object).
 */
export function getApiErrorMessage(
  detail: string | Record<string, unknown> | Array<unknown> | undefined,
  fallback = 'Something went wrong'
): string {
  if (detail == null) return fallback;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const msg = detail
      .map((e) => (e && typeof e === 'object' && 'msg' in e ? String((e as { msg: unknown }).msg) : String(e)))
      .filter(Boolean)
      .join(', ');
    return msg || fallback;
  }
  if (typeof detail === 'object' && detail !== null && 'detail' in detail) {
    const nested = (detail as { detail: unknown }).detail;
    return getApiErrorMessage(nested as string | Record<string, unknown> | Array<unknown> | undefined, fallback);
  }
  return fallback;
}

export default apiClient;
