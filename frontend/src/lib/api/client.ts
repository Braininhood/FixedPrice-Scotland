import axios, { type AxiosInstance } from 'axios';
import { supabase } from '@/lib/supabase';

/** API base URL: in browser use same host as page (so both IP and DNS work); otherwise use env. */
function getBaseURL(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8000/api/v1`;
  }
  return (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) || '';
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
 * Base API origin (no path), e.g. http://localhost:8000
 */
export function getApiOrigin(): string {
  const base = getBaseURL();
  if (!base) return '';
  try {
    const u = new URL(base);
    return u.origin;
  } catch {
    return base.replace(/\/api\/v1\/?$/, '') || '';
  }
}

/**
 * Check backend health (GET /health).
 */
export async function checkApiHealth(): Promise<{ ok: boolean }> {
  const origin = getApiOrigin();
  if (!origin) return { ok: false };
  try {
    const res = await fetch(`${origin}/health`, { method: 'GET', cache: 'no-store' });
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
