import 'server-only';
import { cache } from 'react';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export class UnauthenticatedError extends Error {
  constructor() {
    super('You need to sign in');
  }
}

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  timezone: string;
  dailyGoalMinutes: number;
};

/**
 * The signed-in user, or null. Reads the session cookie and looks the session
 * up in auth_sessions (expired or deleted sessions return null).
 * `cache` dedupes it within one request, so pages and actions can call it freely.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const result = await auth.api.getSession({ headers: await headers() });
  if (!result) return null;
  const { id, name, email, timezone, dailyGoalMinutes } = result.user;
  return { id, name, email, timezone: timezone ?? 'UTC', dailyGoalMinutes: dailyGoalMinutes ?? 120 };
});

/** The signed-in user's id. Call this at the start of every Server Action. */
export async function requireUserId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthenticatedError();
  return user.id;
}
