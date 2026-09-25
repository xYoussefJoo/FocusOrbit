// Fills the local DB with a demo user so you can explore it in Drizzle Studio.
// Run with: npm run db:seed
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const DEMO_USER = 'user_demo';
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);

async function main() {
  // Not importing ./index — that module is 'server-only' and only runs inside Next.js.
  const client = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(client, { schema });

  await db.delete(schema.users).where(eq(schema.users.id, DEMO_USER)); // cascades to everything else
  await db.insert(schema.users).values({ id: DEMO_USER, timezone: 'Africa/Cairo' });

  const [cleanArch] = await db
    .insert(schema.topics)
    .values([
      { userId: DEMO_USER, name: 'Clean Architecture', color: '#34d399' },
      { userId: DEMO_USER, name: 'PostgreSQL', color: '#60a5fa' },
    ])
    .returning();

  const [task] = await db
    .insert(schema.tasks)
    .values({ userId: DEMO_USER, topicId: cleanArch.id, title: 'Design the FocusOrbit schema', status: 'in_progress', estimatedMinutes: 90 })
    .returning();

  const [session] = await db
    .insert(schema.focusSessions)
    .values({
      userId: DEMO_USER,
      topicId: cleanArch.id,
      taskId: task.id,
      status: 'completed',
      plannedSeconds: 25 * 60,
      focusedSeconds: 24 * 60,
      startedAt: minutesAgo(40),
      lastResumedAt: null,
      endedAt: minutesAgo(12),
      reflection: 'Sessions are the core entity; stats are derived, not stored.',
    })
    .returning();

  await db.insert(schema.notes).values({
    userId: DEMO_USER,
    topicId: cleanArch.id,
    sessionId: session.id,
    title: 'Why a partial unique index?',
    content: '# One active session\n\nThe DB guarantees at most one running/paused session per user.',
  });

  const [src] = await db
    .insert(schema.files)
    .values({ userId: DEMO_USER, name: 'src', kind: 'folder' })
    .returning();
  await db.insert(schema.files).values({
    userId: DEMO_USER,
    parentId: src.id,
    name: 'hello.ts',
    kind: 'file',
    language: 'typescript',
    content: "console.log('Hello from FocusOrbit');\n",
  });

  console.log('Seeded demo user:', DEMO_USER);
  await client.end();
}


main().catch((err) => {
  console.error(err);
  process.exit(1);
});
