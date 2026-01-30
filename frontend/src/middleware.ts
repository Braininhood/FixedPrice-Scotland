import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Redirect HTTPS → HTTP when using the app without proper SSL (e.g. EC2 IP).
 * Set NEXT_PUBLIC_FORCE_HTTP=true in production .env so browsers that try
 * https://13.134.11.158 get redirected to http:// after Nginx handles 443.
 */
export function middleware(request: NextRequest) {
  const forceHttp = process.env.NEXT_PUBLIC_FORCE_HTTP === 'true';
  const proto = request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', '');
  if (forceHttp && proto === 'https') {
    const url = request.nextUrl.clone();
    url.protocol = 'http:';
    // Keep host from request so redirect goes to public URL (e.g. 13.134.11.158), not internal
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    if (host) url.host = host;
    return NextResponse.redirect(url, 301);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
