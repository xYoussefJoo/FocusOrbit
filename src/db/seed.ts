// Creates a demo account you can sign in with, plus a few days of history.
// Run with: npm run db:seed        (safe to re-run: the demo user is recreated)
//
//   email:    demo@vesper.dev
//   password: vesper-demo-123      (local development only)
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { hashPassword } from 'better-auth/crypto';
import * as schema from './schema';

const DEMO_ID = 'user_demo';
const DEMO_EMAIL = 'demo@vesper.dev';
const DEMO_PASSWORD = 'vesper-demo-123';
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000);

async function main() {
  // Not importing ./index — that module is 'server-only' and only runs inside Next.js.
  const client = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(client, { schema });

  await db.delete(schema.users).where(eq(schema.users.id, DEMO_ID)); // cascades to everything else
  await db.insert(schema.users).values({
    id: DEMO_ID,
    name: 'Demo Builder',
    email: DEMO_EMAIL,
    emailVerified: true,
    timezone: 'Africa/Cairo',
  });
  // Exactly what Better Auth writes at sign-up: a "credential" account holding the password hash.
  await db.insert(schema.authAccounts).values({
    id: 'acct_demo',
    userId: DEMO_ID,
    accountId: DEMO_ID,
    providerId: 'credential',
    password: await hashPassword(DEMO_PASSWORD),
  });

  const [cleanArch, postgresTopic] = await db
    .insert(schema.topics)
    .values([
      { userId: DEMO_ID, name: 'Clean Architecture' },
      { userId: DEMO_ID, name: 'PostgreSQL' },
    ])
    .returning();

  const [schemaTask, historyTask] = await db
    .insert(schema.tasks)
    .values([
      { userId: DEMO_ID, topicId: cleanArch.id, title: 'Design the Vesper schema', status: 'done', completedAt: hoursAgo(50) },
      { userId: DEMO_ID, topicId: postgresTopic.id, title: 'Write the history query', status: 'in_progress' },
      { userId: DEMO_ID, topicId: postgresTopic.id, title: 'Learn WITH RECURSIVE for the file tree' },
    ])
    .returning();

  // Finished sessions across the last few days → a streak and a history to look at.
  const past = [
    { h: 74, mins: 50, task: schemaTask, topic: cleanArch, note: 'Sessions are the core entity; stats are derived, not stored.' },
    { h: 50, mins: 25, task: schemaTask, topic: cleanArch, note: 'Partial unique index = one active session per user.' },
    { h: 26, mins: 50, task: historyTask, topic: postgresTopic, note: 'AT TIME ZONE turns an instant into a local date.' },
    { h: 3, mins: 25, task: historyTask, topic: postgresTopic, note: null },
  ];
  const sessions = await db
    .insert(schema.focusSessions)
    .values(past.map((p) => ({
      userId: DEMO_ID,
      topicId: p.topic.id,
      taskId: p.task.id,
      status: 'completed' as const,
      plannedSeconds: p.mins * 60,
      focusedSeconds: p.mins * 60 - 45,
      startedAt: hoursAgo(p.h),
      lastResumedAt: null,
      endedAt: new Date(hoursAgo(p.h).getTime() + p.mins * 60_000),
      reflection: p.note,
    })))
    .returning();

  await db.insert(schema.notes).values({
    userId: DEMO_ID,
    topicId: cleanArch.id,
    sessionId: sessions[0].id,
    title: 'Why a partial unique index?',
    content: '# One active session\n\nThe DB guarantees at most one running/paused session per user.',
  });

  console.log(`Seeded demo account → ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
