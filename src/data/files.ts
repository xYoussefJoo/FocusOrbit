import 'server-only';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { files } from '@/db/schema';
import { languageById, withExtension } from '@/lib/languages';
import { assertUuid, isUniqueViolation, SessionError } from './sessions';

// The workspace's code files and folders (roadmap IDE-1). A tree stored as an
// adjacency list: every row points to its parent folder (null = top level).
// Same rules as the other DALs: every query is scoped by userId.
//
// Saving uses optimistic concurrency. The browser sends back the `updatedAt` it loaded,
// and the UPDATE only happens if the row still has it. If another tab saved first, 0 rows
// change and we answer CONFLICT instead of silently overwriting that tab's work.

export type FileSummary = {
  id: string;
  parentId: string | null;
  kind: 'file' | 'folder';
  name: string;
  language: string;
  updatedAt: string;
};
export type FileDTO = FileSummary & { content: string };

const MAX_CONTENT = 200_000; // characters, ~200 KB: plenty for practice files
const NAME_OK = /^[^/\\\u0000-\u001f]{1,80}$/;

// JS dates have millisecond precision, Postgres keeps microseconds; compare at the
// precision the browser actually saw.
const sameVersion = (expected: string) =>
  sql`date_trunc('milliseconds', ${files.updatedAt}) = ${expected}::timestamptz`;

function cleanName(name: unknown, what = 'File'): string {
  const clean = typeof name === 'string' ? name.trim() : '';
  if (!clean) throw new SessionError('INVALID_INPUT', `${what} name can't be empty`);
  if (!NAME_OK.test(clean)) throw new SessionError('INVALID_INPUT', `${what} names are up to 80 characters, without / or \\`);
  return clean;
}

type Row = typeof files.$inferSelect;

function toSummary(f: Pick<Row, 'id' | 'parentId' | 'kind' | 'name' | 'language' | 'updatedAt'>): FileSummary {
  return {
    id: f.id,
    parentId: f.parentId,
    kind: f.kind,
    name: f.name,
    language: f.language ?? 'plaintext',
    updatedAt: f.updatedAt.toISOString(),
  };
}

const summaryColumns = {
  id: files.id, parentId: files.parentId, kind: files.kind, name: files.name, language: files.language, updatedAt: files.updatedAt,
};

/** A parent id from the browser must be one of this user's folders (or null = top level). */
async function assertOwnedFolder(userId: string, parentId: unknown): Promise<string | null> {
  if (parentId == null || parentId === '') return null;
  assertUuid(parentId, 'parentId');
  const [row] = await db.select({ id: files.id }).from(files)
    .where(and(eq(files.id, parentId), eq(files.userId, userId), eq(files.kind, 'folder')));
  if (!row) throw new SessionError('NOT_FOUND', 'Folder not found');
  return parentId;
}

function duplicateName(err: unknown, name: string): never {
  // files_sibling_name_unique: no two items with the same name in one folder.
  if (isUniqueViolation(err)) throw new SessionError('INVALID_INPUT', `There's already something called ${name} in that folder`);
  throw err;
}

// ─── Reads ──────────────────────────────────────────────────────────────────

/** Every file and folder of the user, as a flat list; the browser builds the tree. */
export async function listFiles(userId: string): Promise<FileSummary[]> {
  const rows = await db.select(summaryColumns).from(files)
    .where(eq(files.userId, userId))
    .orderBy(desc(files.kind), asc(files.name)) // 'folder' > 'file': folders first
    .limit(2000);
  return rows.map(toSummary);
}

export async function getFile(userId: string, fileId: unknown): Promise<FileDTO> {
  assertUuid(fileId, 'fileId');
  const [row] = await db.select().from(files)
    .where(and(eq(files.id, fileId), eq(files.userId, userId), eq(files.kind, 'file')));
  if (!row) throw new SessionError('NOT_FOUND', 'File not found');
  return { ...toSummary(row), content: row.content ?? '' };
}

// ─── Create ─────────────────────────────────────────────────────────────────

/** Creates a file with the language's starter code. "Program" + C# becomes "Program.cs". */
export async function createFile(
  userId: string,
  input: { name: unknown; language: unknown; parentId?: unknown },
): Promise<FileDTO> {
  const language = languageById(input?.language);
  if (!language) throw new SessionError('INVALID_INPUT', 'Pick a language from the list');
  const name = cleanName(withExtension(cleanName(input?.name), language));
  const parentId = await assertOwnedFolder(userId, input?.parentId);
  try {
    const [row] = await db.insert(files)
      .values({ userId, parentId, name, kind: 'file', language: language.id, content: language.starter })
      .returning();
    return { ...toSummary(row), content: row.content ?? '' };
  } catch (err) {
    duplicateName(err, name);
  }
}

export async function createFolder(userId: string, input: { name: unknown; parentId?: unknown }): Promise<FileSummary> {
  const name = cleanName(input?.name, 'Folder');
  const parentId = await assertOwnedFolder(userId, input?.parentId);
  try {
    const [row] = await db.insert(files).values({ userId, parentId, name, kind: 'folder' }).returning(summaryColumns);
    return toSummary(row);
  } catch (err) {
    duplicateName(err, name);
  }
}

// A starter layout for a .NET Clean Architecture project, as a nested tree.
type TemplateNode = { name: string; children?: TemplateNode[]; language?: string; content?: string };

function cleanArchitecture(project: string): TemplateNode[] {
  return [
    { name: `${project}.Domain`, children: [
      { name: 'Entities', children: [{ name: 'Item.cs', language: 'csharp', content:
        `namespace ${project}.Domain.Entities;\n\npublic class Item\n{\n    public Guid Id { get; set; }\n    public string Name { get; set; } = string.Empty;\n}\n` }] },
    ] },
    { name: `${project}.Application`, children: [
      { name: 'Interfaces', children: [{ name: 'IItemRepository.cs', language: 'csharp', content:
        `using ${project}.Domain.Entities;\n\nnamespace ${project}.Application.Interfaces;\n\npublic interface IItemRepository\n{\n    Task<Item?> GetAsync(Guid id);\n}\n` }] },
      { name: 'Services', children: [] },
    ] },
    { name: `${project}.Infrastructure`, children: [{ name: 'Persistence', children: [] }] },
    { name: `${project}.Api`, children: [
      { name: 'Controllers', children: [] },
      { name: 'Program.cs', language: 'csharp', content:
        `var builder = WebApplication.CreateBuilder(args);\nvar app = builder.Build();\n\napp.MapGet("/", () => "Hello from ${project}!");\n\napp.Run();\n` },
    ] },
  ];
}

/**
 * A new top-level project folder. `template: 'clean-architecture'` also creates the
 * Domain / Application / Infrastructure / Api layers, all in one transaction.
 */
export async function createProject(userId: string, input: { name: unknown; template?: unknown }): Promise<FileSummary[]> {
  const name = cleanName(input?.name, 'Project');
  // C# namespaces can't contain spaces or dashes: "My Shop" → "MyShop".
  const project = name.replace(/[^A-Za-z0-9_.]/g, '') || 'Project';
  const nodes = input?.template === 'clean-architecture' ? cleanArchitecture(project) : [];
  try {
    return await db.transaction(async (tx) => {
      const created: FileSummary[] = [];
      const insert = async (parentId: string | null, node: TemplateNode) => {
        const isFile = !node.children;
        const [row] = await tx.insert(files).values({
          userId, parentId, name: node.name,
          kind: isFile ? 'file' : 'folder',
          language: isFile ? node.language ?? 'plaintext' : null,
          content: isFile ? node.content ?? '' : null,
        }).returning(summaryColumns);
        created.push(toSummary(row));
        for (const child of node.children ?? []) await insert(row.id, child);
      };
      await insert(null, { name, children: nodes });
      return created;
    });
  } catch (err) {
    duplicateName(err, name);
  }
}

// ─── Save / delete ──────────────────────────────────────────────────────────

/**
 * Saves new content and/or language, only if nobody saved since `expectedUpdatedAt`.
 * Changing the language also changes the extension it was given: Program.cs → Program.py.
 */
export async function saveFile(
  userId: string,
  fileId: unknown,
  changes: { content?: unknown; language?: unknown },
  expectedUpdatedAt: unknown,
): Promise<FileSummary> {
  assertUuid(fileId, 'fileId');
  if (typeof expectedUpdatedAt !== 'string' || Number.isNaN(Date.parse(expectedUpdatedAt))) {
    throw new SessionError('INVALID_INPUT', 'expectedUpdatedAt must be a timestamp');
  }
  const set: { content?: string; language?: string; name?: string } = {};
  if (changes?.content !== undefined) {
    if (typeof changes.content !== 'string') throw new SessionError('INVALID_INPUT', 'Content must be text');
    if (changes.content.length > MAX_CONTENT) throw new SessionError('INVALID_INPUT', 'This file is too large to save (200 KB max)');
    set.content = changes.content;
  }
  if (changes?.language !== undefined) {
    const language = languageById(changes.language);
    if (!language) throw new SessionError('INVALID_INPUT', 'Pick a language from the list');
    set.language = language.id;
    const [current] = await db.select({ name: files.name, language: files.language }).from(files)
      .where(and(eq(files.id, fileId), eq(files.userId, userId), eq(files.kind, 'file')));
    const oldExt = languageById(current?.language)?.ext;
    if (current && oldExt && current.name.endsWith(`.${oldExt}`)) {
      set.name = `${current.name.slice(0, -oldExt.length)}${language.ext}`;
    }
  }
  if (!Object.keys(set).length) throw new SessionError('INVALID_INPUT', 'Nothing to save');

  let row;
  try {
    [row] = await db.update(files)
      .set({ ...set, updatedAt: sql`now()` })
      .where(and(eq(files.id, fileId), eq(files.userId, userId), eq(files.kind, 'file'), sameVersion(expectedUpdatedAt)))
      .returning(summaryColumns);
  } catch (err) {
    duplicateName(err, set.name ?? 'that name');
  }
  if (row) return toSummary(row);

  // 0 rows: either it doesn't exist (for this user), or someone saved it first.
  const [exists] = await db.select({ id: files.id }).from(files)
    .where(and(eq(files.id, fileId), eq(files.userId, userId)));
  if (!exists) throw new SessionError('NOT_FOUND', 'File not found');
  throw new SessionError('CONFLICT', 'This file was changed in another tab. Reload it to see the latest version.');
}

/** Deletes a file, or a folder with everything inside it (ON DELETE CASCADE). */
export async function deleteFile(userId: string, fileId: unknown): Promise<void> {
  assertUuid(fileId, 'fileId');
  const [row] = await db.delete(files)
    .where(and(eq(files.id, fileId), eq(files.userId, userId)))
    .returning({ id: files.id });
  if (!row) throw new SessionError('NOT_FOUND', 'File not found');
}
