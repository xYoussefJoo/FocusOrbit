import 'server-only';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { db } from '@/db';
import { authAccounts, authSessions, authVerifications, users } from '@/db/schema';
import { validTimezone } from './timezone';

// Better Auth runs inside our app and stores everything in our Postgres:
//   users              — who you are (shared with the rest of Vesper)
//   auth_accounts      — how you log in (provider "credential" + scrypt password hash)
//   auth_sessions      — one row per signed-in device; its token is the session cookie
//   auth_verifications — short-lived tokens (email verification, password reset)

export const auth = betterAuth({
  appName: 'Vesper',
  database: drizzleAdapter(db, {
    provider: 'pg',
    // Better Auth's model names → our tables
    schema: { user: users, session: authSessions, account: authAccounts, verification: authVerifications },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true, // sign-up signs you in immediately
  },
  user: {
    additionalFields: {
      // Sent by the sign-up form (the browser's timezone) so "today" and streaks match your day.
      timezone: { type: 'string', required: false, defaultValue: 'UTC', input: true },
      dailyGoalMinutes: { type: 'number', required: false, defaultValue: 120, input: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        // Never trust client input: an invalid timezone would break date queries later.
        before: async (user) => ({ data: { ...user, timezone: validTimezone(user.timezone) } }),
      },
    },
  },
  plugins: [nextCookies()], // lets server actions set auth cookies; keep it last
});
