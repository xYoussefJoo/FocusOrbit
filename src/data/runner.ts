import 'server-only';
import { languageById } from '@/lib/languages';
import { SessionError } from './sessions';

// Runs code in Piston (https://github.com/engineer-man/piston), a sandboxed runner in its
// own Docker container (docker-compose.yml, service "runner"). Rule #1 from journal 006:
// user code NEVER runs inside the Next.js server. Piston runs each job in an isolated
// sandbox with no network and the time and memory limits below.
//
// JavaScript and TypeScript don't come here: they run in a Web Worker in the browser.

const PISTON_URL = process.env.PISTON_URL ?? 'http://localhost:2000';

// Our language id → Piston's runtime name. C# uses the .NET runtime ("csharp.net"),
// which supports top-level statements like `Console.WriteLine("hi");`.
// C++ ('c++', package gcc) and Go ('go') are left out on purpose: each runtime is a
// large download into Docker's disk, and this machine's C: drive has little room.
export const RUNTIMES: Record<string, string> = {
  csharp: 'csharp.net',
  python: 'python',
  java: 'java',
};

export type RunResult = {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal: string | null; // e.g. "SIGKILL" when the time limit was hit
  compileOutput: string | null; // compiler errors for compiled languages
  runtime: string; // e.g. "csharp.net 5.0.201"
};

type PistonStage = { stdout: string; stderr: string; code: number | null; signal: string | null; output: string };

export async function runCode(input: { language: unknown; fileName: unknown; content: unknown; stdin?: unknown }): Promise<RunResult> {
  const language = languageById(input?.language);
  const runtime = language && RUNTIMES[language.id];
  if (!runtime) throw new SessionError('INVALID_INPUT', `Running ${language?.label ?? 'this language'} isn't supported yet`);
  if (typeof input.content !== 'string' || input.content.length > 200_000) throw new SessionError('INVALID_INPUT', 'Code must be text, up to 200 KB');
  const fileName = typeof input.fileName === 'string' && input.fileName.trim() ? input.fileName.trim().slice(0, 80) : `main.${language.ext}`;
  const stdin = typeof input.stdin === 'string' ? input.stdin.slice(0, 10_000) : '';
  const file = prepare(language.id, fileName, input.content);

  let res: Response;
  try {
    res = await fetch(`${PISTON_URL}/api/v2/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: runtime,
        version: '*',
        files: [file],
        stdin,
        compile_timeout: 30_000, // ms: .NET's build step alone takes ~10 s
        run_timeout: 5_000, // ms: an infinite loop is stopped after 5 s
        run_memory_limit: 256 * 1024 * 1024, // bytes
      }),
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    throw new SessionError('RUNNER_UNAVAILABLE', "The code runner isn't running. Start it with: npm run runner:up");
  }

  const body = (await res.json().catch(() => null)) as
    | { message?: string; language?: string; version?: string; run?: PistonStage; compile?: PistonStage }
    | null;
  if (!res.ok || !body?.run) {
    const message = body?.message ?? `Runner error (${res.status})`;
    if (/runtime is unknown/i.test(message)) {
      throw new SessionError('RUNNER_UNAVAILABLE', `${language.label} isn't installed in the runner yet. Install it with: npm run runner:install`);
    }
    throw new SessionError('INVALID_STATE', message);
  }

  const compile = body.compile;
  const compileFailed = !!compile && compile.code !== 0;
  return {
    stdout: compileFailed ? '' : body.run.stdout,
    stderr: compileFailed ? '' : body.run.stderr,
    exitCode: compileFailed ? compile.code : body.run.code,
    signal: compileFailed ? null : body.run.signal,
    compileOutput: compileFailed ? compileErrors(compile) : null,
    runtime: `${body.language} ${body.version}`,
  };
}

// The C# runtime is .NET 5, which has no implicit usings (they came in .NET 6), so
// `Console.WriteLine` alone wouldn't compile. We add the usings .NET 6+ adds for you,
// on the SAME first line, so the line numbers in compile errors still match your code.
const CSHARP_USINGS = 'using System; using System.Collections.Generic; using System.IO; using System.Linq; using System.Threading.Tasks; ';

function prepare(language: string, fileName: string, content: string): { name: string; content: string } {
  if (language === 'csharp') {
    // Piston's .NET script adds ".cs" to the name itself, then generates (and deletes) its
    // own Program.cs, so a file named "Program" collides with it. A fixed name avoids both.
    return { name: 'main', content: CSHARP_USINGS + content };
  }
  return { name: fileName, content };
}

/** Only the useful part of a failed build: .NET's also prints restore/template chatter. */
function compileErrors(compile: PistonStage): string {
  if (compile.signal === 'SIGKILL' && compile.code === null) return 'Compiling took longer than 30 s and was stopped.';
  const lines = compile.output.split(/\r?\n/);
  const errors = lines.filter((l) => /\berror\b/i.test(l));
  // MSBuild repeats every error in its summary; show each one once.
  return [...new Set(errors.length ? errors : lines)].join('\n').trim();
}
