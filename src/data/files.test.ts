// Integration tests against the real Docker Postgres. Run: npm test
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import '@/test/load-env'; // must stay above '@/db', which reads DATABASE_URL on import
import { inArray } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { SessionError } from './sessions';
import * as F from './files';

const ALICE = 'test_files_alice';
const BOB = 'test_files_bob';

async function rejectsWith(p: Promise<unknown>, code: string) {
  await assert.rejects(p, (err: unknown) => err instanceof SessionError && err.code === code);
}

before(async () => {
  await db.delete(users).where(inArray(users.id, [ALICE, BOB]));
  await db.insert(users).values([
    { id: ALICE, name: 'Alice', email: 'files-alice@test.invalid' },
    { id: BOB, name: 'Bob', email: 'files-bob@test.invalid' },
  ]);
});

after(async () => {
  await db.delete(users).where(inArray(users.id, [ALICE, BOB])); // cascades to files
  await (globalThis as unknown as { pgClient?: { end(): Promise<void> } }).pgClient?.end();
});

test('create → the extension is added and the starter code is filled in', async () => {
  const file = await F.createFile(ALICE, { name: 'Program', language: 'csharp' });
  assert.equal(file.name, 'Program.cs');
  assert.equal(file.language, 'csharp');
  assert.match(file.content, /Console\.WriteLine/);

  const kept = await F.createFile(ALICE, { name: 'script.mjs', language: 'javascript' });
  assert.equal(kept.name, 'script.mjs', 'a typed extension is kept');

  assert.deepEqual((await F.listFiles(ALICE)).map((f) => f.name), ['Program.cs', 'script.mjs']);
});

test('names are unique per user, not across users', async () => {
  await F.createFile(ALICE, { name: 'dupe', language: 'python' });
  await rejectsWith(F.createFile(ALICE, { name: 'dupe.py', language: 'python' }), 'INVALID_INPUT');
  await F.createFile(BOB, { name: 'dupe', language: 'python' }); // Bob can have his own
});

test('save → content and language change, and the version moves forward', async () => {
  const file = await F.createFile(ALICE, { name: 'save-me', language: 'typescript' });
  const saved = await F.saveFile(ALICE, file.id, { content: 'const x = 1;\n' }, file.updatedAt);
  assert.notEqual(saved.updatedAt, file.updatedAt);

  const relabeled = await F.saveFile(ALICE, file.id, { language: 'javascript' }, saved.updatedAt);
  assert.equal(relabeled.language, 'javascript');
  assert.equal(relabeled.name, 'save-me.js', 'the extension follows the language');

  const reloaded = await F.getFile(ALICE, file.id);
  assert.equal(reloaded.content, 'const x = 1;\n');
  assert.equal(reloaded.updatedAt, relabeled.updatedAt);
});

test('two tabs: the second save with an old version gets CONFLICT, nothing is overwritten', async () => {
  const file = await F.createFile(ALICE, { name: 'two-tabs', language: 'sql' });
  await F.saveFile(ALICE, file.id, { content: 'tab A' }, file.updatedAt);
  await rejectsWith(F.saveFile(ALICE, file.id, { content: 'tab B' }, file.updatedAt), 'CONFLICT');
  assert.equal((await F.getFile(ALICE, file.id)).content, 'tab A');
});

test('changing the language keeps a custom extension, and refuses a name clash', async () => {
  const custom = await F.createFile(ALICE, { name: 'notes.mjs', language: 'javascript' });
  const kept = await F.saveFile(ALICE, custom.id, { language: 'typescript' }, custom.updatedAt);
  assert.equal(kept.name, 'notes.mjs', 'an extension we did not add is left alone');

  await F.createFile(ALICE, { name: 'clash', language: 'python' }); // clash.py
  const cs = await F.createFile(ALICE, { name: 'clash', language: 'csharp' }); // clash.cs
  await rejectsWith(F.saveFile(ALICE, cs.id, { language: 'python' }, cs.updatedAt), 'INVALID_INPUT');
});

test('folders: files go inside, names are unique per folder, deleting a folder deletes its contents', async () => {
  const src = await F.createFolder(ALICE, { name: 'src' });
  const inSrc = await F.createFile(ALICE, { name: 'Program', language: 'csharp', parentId: src.id });
  assert.equal(inSrc.parentId, src.id);
  // Program.cs exists at the top level too (first test): a different folder, so that's fine.
  const nested = await F.createFolder(ALICE, { name: 'Services', parentId: src.id });
  await F.createFile(ALICE, { name: 'Service', language: 'csharp', parentId: nested.id });
  await rejectsWith(F.createFolder(ALICE, { name: 'Services', parentId: src.id }), 'INVALID_INPUT');

  await F.deleteFile(ALICE, src.id);
  const left = await F.listFiles(ALICE);
  assert.ok(!left.some((f) => f.id === src.id || f.id === inSrc.id || f.id === nested.id), 'the whole subtree is gone');
});

test("you can't put things in someone else's folder, or inside a file", async () => {
  const bobs = await F.createFolder(BOB, { name: 'bobs' });
  await rejectsWith(F.createFile(ALICE, { name: 'sneaky', language: 'csharp', parentId: bobs.id }), 'NOT_FOUND');
  const file = await F.createFile(ALICE, { name: 'not-a-folder', language: 'csharp' });
  await rejectsWith(F.createFolder(ALICE, { name: 'x', parentId: file.id }), 'NOT_FOUND');
});

test('a Clean Architecture project creates its layers in one go', async () => {
  const created = await F.createProject(ALICE, { name: 'My Shop', template: 'clean-architecture' });
  const names = created.map((f) => f.name);
  assert.equal(created[0].name, 'My Shop');
  assert.equal(created[0].kind, 'folder');
  for (const layer of ['MyShop.Domain', 'MyShop.Application', 'MyShop.Infrastructure', 'MyShop.Api', 'Program.cs']) {
    assert.ok(names.includes(layer), `has ${layer}`);
  }
  const program = created.find((f) => f.name === 'Program.cs')!;
  assert.match((await F.getFile(ALICE, program.id)).content, /Hello from MyShop/);
  await rejectsWith(F.createProject(ALICE, { name: 'My Shop' }), 'INVALID_INPUT'); // name taken
});

test("authorization: you can't read, save or delete another user's file", async () => {
  const file = await F.createFile(ALICE, { name: 'private', language: 'go' });
  await rejectsWith(F.getFile(BOB, file.id), 'NOT_FOUND');
  await rejectsWith(F.saveFile(BOB, file.id, { content: 'hacked' }, file.updatedAt), 'NOT_FOUND');
  await rejectsWith(F.deleteFile(BOB, file.id), 'NOT_FOUND');
  assert.equal((await F.getFile(ALICE, file.id)).content, file.content);
});

test('delete removes it from the list', async () => {
  const file = await F.createFile(ALICE, { name: 'temp', language: 'markdown' });
  await F.deleteFile(ALICE, file.id);
  assert.ok(!(await F.listFiles(ALICE)).some((f) => f.id === file.id));
  await rejectsWith(F.getFile(ALICE, file.id), 'NOT_FOUND');
});

test('input validation', async () => {
  await rejectsWith(F.createFile(ALICE, { name: '', language: 'csharp' }), 'INVALID_INPUT');
  await rejectsWith(F.createFile(ALICE, { name: 'a/b', language: 'csharp' }), 'INVALID_INPUT');
  await rejectsWith(F.createFile(ALICE, { name: 'x', language: 'cobol' }), 'INVALID_INPUT');
  const file = await F.createFile(ALICE, { name: 'big', language: 'plaintext' });
  await rejectsWith(F.saveFile(ALICE, file.id, { content: 'x'.repeat(200_001) }, file.updatedAt), 'INVALID_INPUT');
  await rejectsWith(F.saveFile(ALICE, file.id, {}, file.updatedAt), 'INVALID_INPUT');
  await rejectsWith(F.getFile(ALICE, 'not-a-uuid'), 'INVALID_INPUT');
});
