import 'server-only';
import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { db } from '@/db';
import { focusSessions, tasks, topics } from '@/db/schema';
import { computeStreak } from '@/lib/streak';
import { validTimezone } from '@/lib/timezone';

// History and "Today" stats are *calculated* from focus_sessions, never stored
// (chapter 07, decision 2). "Which day?" is answered in the user's timezone
// by Postgres: (started_at AT TIME ZONE 'Africa/Cairo')::date.

export type HistorySession = {
  id: string;
  status: 'completed' | 'abandoned';
  focusedSeconds: number;
  plannedSeconds: number;
  startedAt: string;
  endedAt: string | null;
  reflection: string | null;
  taskTitle: string | null;
  topicName: string | null;
};
export type HistoryDay = { day: string; totalSeconds: number; sessions: HistorySession[] };

export type TodayStats = {
  today: string; // the user's local date, YYYY-MM-DD
  focusedSeconds: number; // finished sessions only; the browser adds the live one
  sessionsCompleted: number;
  goalSeconds: number;
  streakDays: number;
};

const ENDED = ['completed', 'abandoned'] as const;
const localDay = (tz: string) =>
  sql<string>`to_char(${focusSessions.startedAt} at time zone ${tz}, 'YYYY-MM-DD')`;

export async function getHistory(userId: string, timezone: string, days = 30): Promise<HistoryDay[]> {
  const tz = validTimezone(timezone);
  const rows = await db
    .select({
      id: focusSessions.id,
      status: focusSessions.status,
      focusedSeconds: focusSessions.focusedSeconds,
      plannedSeconds: focusSessions.plannedSeconds,
      startedAt: focusSessions.startedAt,
      endedAt: focusSessions.endedAt,
      reflection: focusSessions.reflection,
      taskTitle: tasks.title,
      topicName: topics.name,
      day: localDay(tz),
    })
    .from(focusSessions)
    .leftJoin(tasks, eq(tasks.id, focusSessions.taskId))
    .leftJoin(topics, eq(topics.id, focusSessions.topicId))
    .where(and(
      eq(focusSessions.userId, userId),
      inArray(focusSessions.status, ENDED),
      gte(focusSessions.startedAt, sql`now() - make_interval(days => ${days})`),
    ))
    .orderBy(desc(focusSessions.startedAt))
    .limit(300);

  const byDay = new Map<string, HistoryDay>();
  for (const r of rows) {
    const group = byDay.get(r.day) ?? { day: r.day, totalSeconds: 0, sessions: [] };
    group.totalSeconds += r.focusedSeconds;
    group.sessions.push({
      id: r.id,
      status: r.status as HistorySession['status'],
      focusedSeconds: r.focusedSeconds,
      plannedSeconds: r.plannedSeconds,
      startedAt: r.startedAt.toISOString(),
      endedAt: r.endedAt?.toISOString() ?? null,
      reflection: r.reflection,
      taskTitle: r.taskTitle,
      topicName: r.topicName,
    });
    byDay.set(r.day, group);
  }
  return [...byDay.values()]; // already newest first
}

export async function getTodayStats(userId: string, timezone: string, dailyGoalMinutes: number): Promise<TodayStats> {
  const tz = validTimezone(timezone);
  const day = localDay(tz);
  const [[{ today }], [totals], streakRows] = await Promise.all([
    db.execute<{ today: string }>(sql`select to_char(now() at time zone ${tz}, 'YYYY-MM-DD') as today`),
    db
      .select({
        focused: sql<number>`coalesce(sum(${focusSessions.focusedSeconds}), 0)::int`,
        completed: sql<number>`count(*) filter (where ${focusSessions.status} = 'completed')::int`,
      })
      .from(focusSessions)
      .where(and(
        eq(focusSessions.userId, userId),
        inArray(focusSessions.status, ENDED),
        sql`${day} = to_char(now() at time zone ${tz}, 'YYYY-MM-DD')`,
      )),
    db
      .selectDistinct({ day })
      .from(focusSessions)
      .where(and(
        eq(focusSessions.userId, userId),
        eq(focusSessions.status, 'completed'),
        gte(focusSessions.startedAt, sql`now() - interval '400 days'`),
      )),
  ]);

  return {
    today,
    focusedSeconds: totals?.focused ?? 0,
    sessionsCompleted: totals?.completed ?? 0,
    goalSeconds: dailyGoalMinutes * 60,
    streakDays: computeStreak(streakRows.map((r) => r.day), today),
  };
}
