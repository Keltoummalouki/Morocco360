import { NextRequest, NextResponse } from 'next/server';

// ── JWT decode (Edge-compatible, no library needed) ────────
interface JwtPayload { sub: number; email: string; role: string; exp: number; }

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
  { path: '/dashboard/organizer', allowed: ['ORGANIZER', 'ADMIN'] },
  { path: '/dashboard/user',      allowed: ['USER', 'ORGANIZER', 'ADMIN'] },
  { path: '/dashboard',           allowed: ['USER', 'ORGANIZER', 'ADMIN'] },
];

const ROLE_HOME: Record<string, string> = {
  ADMIN:     '/dashboard/admin',
  ORGANIZER: '/dashboard/organizer',
  USER:      '/dashboard/user',
};

// Paths that should redirect authenticated users away
const AUTH_ONLY_PATHS = ['/login', '/register'];

// Prefixes that always bypass the middleware (Next.js internals + our auth API)
const BYPASS_PREFIXES = ['/api/auth', '/_next', '/favicon.ico'];

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

  // ── Redirect authenticated users away from auth pages ───
  if (AUTH_ONLY_PATHS.some((p) => pathname.startsWith(p))) {
    if (isAuthenticated && ROLE_HOME[role!]) {
      return NextResponse.redirect(new URL(ROLE_HOME[role!], request.url));
    }
    return NextResponse.next();
  }

  // ── Protect dashboard routes ─────────────────────────────
  if (pathname.startsWith('/dashboard')) {
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
