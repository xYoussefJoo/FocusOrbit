import { relations, sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

// All times are stored as UTC instants (timestamptz). The user's timezone is
// only used when grouping into "days" for streaks and daily stats.
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

// ─── Enums ──────────────────────────────────────────────────────────────────

export const taskStatus = pgEnum('task_status', ['todo', 'in_progress', 'done']);
export const sessionStatus = pgEnum('session_status', ['running', 'paused', 'completed', 'abandoned']);
export const fileKind = pgEnum('file_kind', ['file', 'folder']);

// ─── Users ──────────────────────────────────────────────────────────────────
// Clerk owns identity (email, name, avatar). We only keep the Clerk user id
// plus the preferences our own features need.

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk user id, e.g. "user_2abc..."
  timezone: text('timezone').notNull().default('UTC'), // IANA name, e.g. "Africa/Cairo"
  dailyGoalMinutes: integer('daily_goal_minutes').notNull().default(120),
  createdAt: createdAt(),
});

// ─── Topics ─────────────────────────────────────────────────────────────────
// "What did I study?" — the label that ties sessions, notes and tasks together.

export const topics = pgTable(
  'topics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    color: text('color'),
    createdAt: createdAt(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
  },
  (t) => [unique('topics_user_name_unique').on(t.userId, t.name)],
);

// ─── Tasks ──────────────────────────────────────────────────────────────────

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    topicId: uuid('topic_id').references(() => topics.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    status: taskStatus('status').notNull().default('todo'),
    estimatedMinutes: integer('estimated_minutes'),
    createdAt: createdAt(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => [index('tasks_user_status_idx').on(t.userId, t.status)],
);

// ─── Focus sessions ─────────────────────────────────────────────────────────
// Pause/resume without a separate "pauses" table:
//   resume → lastResumedAt = now
//   pause  → focusedSeconds += now - lastResumedAt; lastResumedAt = null
// So the live focused time is always: focusedSeconds + (now - lastResumedAt).

export const focusSessions = pgTable(
  'focus_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    topicId: uuid('topic_id').references(() => topics.id, { onDelete: 'set null' }),
    taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'set null' }),
    status: sessionStatus('status').notNull().default('running'),
    plannedSeconds: integer('planned_seconds').notNull(),
    focusedSeconds: integer('focused_seconds').notNull().default(0),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    lastResumedAt: timestamp('last_resumed_at', { withTimezone: true }).defaultNow(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    reflection: text('reflection'), // "What did I learn?" — written when the session ends
  },
  (t) => [
    index('focus_sessions_user_started_idx').on(t.userId, t.startedAt),
    // A user can only have one active session at a time — enforced by the DB, not just the UI.
    uniqueIndex('focus_sessions_one_active_per_user')
      .on(t.userId)
      .where(sql`${t.status} in ('running', 'paused')`),
    check('focus_sessions_planned_positive', sql`${t.plannedSeconds} > 0`),
    check('focus_sessions_focused_non_negative', sql`${t.focusedSeconds} >= 0`),
  ],
);

// ─── Notes ──────────────────────────────────────────────────────────────────
// Content is Markdown for now: portable, diffable, easy to render.

export const notes = pgTable(
  'notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    topicId: uuid('topic_id').references(() => topics.id, { onDelete: 'set null' }),
    sessionId: uuid('session_id').references(() => focusSessions.id, { onDelete: 'set null' }),
    title: text('title').notNull().default('Untitled'),
    content: text('content').notNull().default(''),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
  },
  (t) => [index('notes_user_updated_idx').on(t.userId, t.updatedAt)],
);

// ─── Workspace files (the IDE explorer) ─────────────────────────────────────
// A tree stored as an "adjacency list": every row points to its parent folder.

export const files = pgTable(
  'files',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id').references((): AnyPgColumn => files.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    kind: fileKind('kind').notNull(),
    language: text('language'), // Monaco language id, e.g. "typescript", "csharp"
    content: text('content'), // null for folders
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    // No two siblings with the same name. NULLS NOT DISTINCT makes this also
    // apply at the root level, where parent_id is null.
    unique('files_sibling_name_unique').on(t.userId, t.parentId, t.name).nullsNotDistinct(),
    check('files_folder_has_no_content', sql`${t.kind} = 'file' or ${t.content} is null`),
  ],
);

// ─── Relations (used by db.query.* for nested reads) ────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  topics: many(topics),
  tasks: many(tasks),
  sessions: many(focusSessions),
  notes: many(notes),
  files: many(files),
}));

export const topicsRelations = relations(topics, ({ one, many }) => ({
  user: one(users, { fields: [topics.userId], references: [users.id] }),
  tasks: many(tasks),
  sessions: many(focusSessions),
  notes: many(notes),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  user: one(users, { fields: [tasks.userId], references: [users.id] }),
  topic: one(topics, { fields: [tasks.topicId], references: [topics.id] }),
  sessions: many(focusSessions),
}));

export const focusSessionsRelations = relations(focusSessions, ({ one, many }) => ({
  user: one(users, { fields: [focusSessions.userId], references: [users.id] }),
  topic: one(topics, { fields: [focusSessions.topicId], references: [topics.id] }),
  task: one(tasks, { fields: [focusSessions.taskId], references: [tasks.id] }),
  notes: many(notes),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  user: one(users, { fields: [notes.userId], references: [users.id] }),
  topic: one(topics, { fields: [notes.topicId], references: [topics.id] }),
  session: one(focusSessions, { fields: [notes.sessionId], references: [focusSessions.id] }),
}));

export const filesRelations = relations(files, ({ one, many }) => ({
  user: one(users, { fields: [files.userId], references: [users.id] }),
  parent: one(files, { fields: [files.parentId], references: [files.id], relationName: 'tree' }),
  children: many(files, { relationName: 'tree' }),
}));

// ─── Row types for the rest of the app ──────────────────────────────────────

export type User = typeof users.$inferSelect;
export type Topic = typeof topics.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type FocusSession = typeof focusSessions.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type WorkspaceFile = typeof files.$inferSelect;
