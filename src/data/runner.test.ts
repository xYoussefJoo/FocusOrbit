// Integration tests against the Piston runner container (npm run runner:up).
// They are skipped, not failed, when the runner isn't running, so `npm test` still
// works with only the database up.
import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { SessionError } from './sessions';
import { runCode } from './runner';

let runtimes: string[] = [];
before(async () => {
  runtimes = await fetch(`${process.env.PISTON_URL ?? 'http://localhost:2000'}/api/v2/runtimes`)
    .then((r) => r.json())
    .then((list: { language: string }[]) => list.map((r) => r.language))
    .catch(() => []);
});
const needs = (runtime: string) => ({ skip: !runtimes.includes(runtime) && `runner or ${runtime} not installed` });

test('languages the runner does not handle are refused up front', async () => {
  await assert.rejects(
    runCode({ language: 'html', fileName: 'x.html', content: '<p>' }),
    (e: unknown) => e instanceof SessionError && e.code === 'INVALID_INPUT',
  );
});

test('Python: output and errors come back separately', async (t) => {
  if (needs('python').skip) return t.skip(needs('python').skip as string);
  const r = await runCode({ language: 'python', fileName: 'main.py', content: 'print("hi")\nprint(1/0)\n' });
  assert.equal(r.stdout, 'hi\n');
  assert.match(r.stderr, /ZeroDivisionError/);
  assert.equal(r.exitCode, 1);
});

test('an infinite loop is stopped by the time limit', async (t) => {
  if (needs('python').skip) return t.skip(needs('python').skip as string);
  const r = await runCode({ language: 'python', fileName: 'loop.py', content: 'while True: pass\n' });
  assert.equal(r.signal, 'SIGKILL');
});

test('C#: top-level statements compile and run; compile errors are reported', async (t) => {
  if (needs('csharp.net').skip) return t.skip(needs('csharp.net').skip as string);
  const ok = await runCode({ language: 'csharp', fileName: 'Program.cs', content: 'Console.WriteLine("Hello from C#");\n' });
  assert.equal(ok.compileOutput, null);
  assert.equal(ok.stdout.trim(), 'Hello from C#');

  const bad = await runCode({ language: 'csharp', fileName: 'Program.cs', content: 'Console.WriteLine("no semicolon")\n' });
  assert.ok(bad.compileOutput, 'has compile errors');
  assert.match(bad.compileOutput!, /CS1002|; expected/);
});
