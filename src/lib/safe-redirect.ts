/**
 * Where to go after signing in. Only same-site paths are allowed, otherwise a
 * link like /sign-in?next=//evil.com would bounce a user to another site
 * right after they logged in (an "open redirect").
 *
 *   "/workspace"        → allowed
 *   "//evil.com"        → rejected (protocol-relative URL)
 *   "/\evil.com"        → rejected (browsers treat \ as /)
 *   "https://evil.com"  → rejected
 */
export function safeNext(next: unknown, fallback = '/workspace'): string {
  if (typeof next !== 'string' || !next.startsWith('/')) return fallback;
  const second = next.charAt(1);
  if (second === '/' || second === '\\') return fallback;
  return next;
}
