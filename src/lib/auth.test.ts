// Better Auth against our real Postgres tables. Run: npm test
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import '@/test/load-env'; // must stay above '@/db', which reads DATABASE_URL on import
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { authAccounts, authSessions, users } from '@/db/schema';
import { auth } from './auth';

const EMAIL = 'auth-test@test.invalid';
const PASSWORD = 'correct horse battery';

async function cleanup() {
  await db.delete(users).where(eq(users.email, EMAIL)); // cascades to accounts and sessions
}

before(cleanup);
after(async () => {
  await cleanup();
  await (globalThis as unknown as { pgClient?: { end(): Promise<void> } }).pgClient?.end();
});

test('sign-up stores a user, a credential account with a HASHED password, and a session', async () => {
  const res = await auth.api.signUpEmail({ body: { name: 'Auth Test', email: EMAIL, password: PASSWORD, timezone: 'Africa/Cairo' } });
  assert.ok(res.token, 'auto sign-in returns a session token');

  const [user] = await db.select().from(users).where(eq(users.email, EMAIL));
  assert.equal(user.timezone, 'Africa/Cairo');
  assert.equal(user.dailyGoalMinutes, 120);

  const [account] = await db.select().from(authAccounts).where(eq(authAccounts.userId, user.id));
  assert.equal(account.providerId, 'credential');
  assert.ok(account.password && account.password !== PASSWORD, 'the password is never stored as plain text');

  const sessions = await db.select().from(authSessions).where(eq(authSessions.userId, user.id));
  assert.equal(sessions.length, 1);
});

test('an invalid timezone from the sign-up form is replaced with UTC', async () => {
  await cleanup();
  await auth.api.signUpEmail({ body: { name: 'Auth Test', email: EMAIL, password: PASSWORD, timezone: 'Not/AZone' } });
  const [user] = await db.select().from(users).where(eq(users.email, EMAIL));
  assert.equal(user.timezone, 'UTC');
});

test('sign-in checks the password against the hash', async () => {
  const ok = await auth.api.signInEmail({ body: { email: EMAIL, password: PASSWORD } });
  assert.ok(ok.token);
  await assert.rejects(auth.api.signInEmail({ body: { email: EMAIL, password: 'wrong password!' } }));
});

test('the same email cannot sign up twice', async () => {
  await assert.rejects(auth.api.signUpEmail({ body: { name: 'Again', email: EMAIL, password: PASSWORD } }));
});
