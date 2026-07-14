import { NextRequest, NextResponse } from 'next/server';

// ── JWT decode (Edge-compatible, no library needed) ────────
interface JwtPayload { sub: number; email: string; role: string; status?: string; exp: number; }

function decodeJwt(token: string): JwtPayload | null {
  try {
    const segment = token.split('.')[1];
    // Convert base64url → base64, then add required '=' padding
    const b64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

// ── Route access rules (most-specific first) ──────────────
const ROLE_ROUTES: { path: string; allowed: string[] }[] = [
  { path: '/dashboard/admin',     allowed: ['ADMIN'] },
  { path: '/dashboard/scanner',   allowed: ['STAFF', 'ORGANIZER', 'ADMIN'] },
  { path: '/dashboard/organizer', allowed: ['ORGANIZER', 'ADMIN'] },
  { path: '/dashboard/staff',     allowed: ['STAFF', 'ORGANIZER', 'ADMIN'] },
  { path: '/dashboard/user',      allowed: ['USER', 'ORGANIZER', 'ADMIN'] },
  { path: '/dashboard',           allowed: ['USER', 'ORGANIZER', 'ADMIN', 'STAFF'] },
  // The user "app" (mobile-style) — replaces /dashboard/user for the USER role.
  { path: '/user',                allowed: ['USER', 'ORGANIZER', 'ADMIN'] },
];

// Prefixes that require authentication (role checks come from ROLE_ROUTES).
const PROTECTED_PREFIXES = ['/dashboard', '/user'];

const ROLE_HOME: Record<string, string> = {
  ADMIN:     '/dashboard/admin',
  ORGANIZER: '/dashboard/organizer',
  STAFF:     '/dashboard/staff',
  USER:      '/user/events',
};

// Paths that should redirect authenticated users away
const AUTH_ONLY_PATHS = ['/login', '/register'];

// Prefixes that always bypass the middleware (Next.js internals + our auth API)
const BYPASS_PREFIXES = ['/api/auth', '/_next', '/favicon.ico', '/suspended'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always let through internal routes
  if (BYPASS_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // ── Resolve identity from the httpOnly access_token JWT ─
  const rawToken = request.cookies.get('access_token')?.value ?? null;
  const payload  = rawToken ? decodeJwt(rawToken) : null;

  // Token exists but is expired → trigger silent refresh then resume
  if (payload && payload.exp * 1000 < Date.now()) {
    const refreshUrl = new URL('/api/auth/refresh', request.url);
    refreshUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(refreshUrl);
  }

  const role            = payload?.role ?? null;
  const isAuthenticated = !!role;

  // ── Redirect suspended users to /suspended ───────────────
  if (payload && payload.status === 'SUSPENDED' && !pathname.startsWith('/suspended')) {
    return NextResponse.redirect(new URL('/suspended', request.url));
  }

  // ── Redirect authenticated users away from auth pages ───
  if (AUTH_ONLY_PATHS.some((p) => pathname.startsWith(p))) {
    if (isAuthenticated && ROLE_HOME[role!]) {
      return NextResponse.redirect(new URL(ROLE_HOME[role!], request.url));
    }
    return NextResponse.next();
  }

  // ── Protect dashboard + user-app routes ──────────────────
  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Generic /dashboard → redirect to role-specific home
    if (pathname === '/dashboard' && ROLE_HOME[role!]) {
      return NextResponse.redirect(new URL(ROLE_HOME[role!], request.url));
    }

    // Check role against route rules (first match wins)
    for (const { path, allowed } of ROLE_ROUTES) {
      if (pathname.startsWith(path)) {
        if (!allowed.includes(role!)) {
          const url = new URL('/unauthorized', request.url);
          url.searchParams.set('from', pathname);
          return NextResponse.redirect(url);
        }
        break;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',],
};
