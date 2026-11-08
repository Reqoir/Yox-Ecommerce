import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  // In local development, bypass subdomain redirect to allow direct access to /admin on localhost
  const isLocalDev =
    process.env.NODE_ENV === 'development' ||
    host.includes('localhost') ||
    host.includes('127.0.0.1');

  if (isLocalDev) {
    return NextResponse.next();
  }

  // Detect if accessing through the admin subdomain
  const isAdminSubdomain = host.startsWith('admin.');

  if (isAdminSubdomain) {
    // When visiting the root of admin.yourdomain.com, redirect directly to /admin
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  // If a user on the main storefront (yourdomain.com) tries to access admin routes:
  if (pathname.startsWith('/admin') || pathname.startsWith('/admin-login')) {
    const cleanHost = host.replace(/^www\./, '');
    const adminUrl = new URL(pathname, `https://admin.${cleanHost}`);
    adminUrl.search = request.nextUrl.search;
    return NextResponse.redirect(adminUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Apply middleware across all application routes excluding static files, images, and API endpoints
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};

