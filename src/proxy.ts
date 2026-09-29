import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

// A fast, optimistic gate: no cookie → go sign in. It only checks that a
// session cookie EXISTS; the real check (is it valid and unexpired?) happens
// in the workspace page and in every Server Action via getCurrentUser().
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    const url = new URL('/sign-in', request.url);
    url.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/workspace/:path*'],
};
