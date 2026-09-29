'use client';

import { useCallback, useRef, useState } from 'react';
import { runCodeAction } from '@/app/actions/files';
import { languageById } from '@/lib/languages';
import { runInBrowser, type OutputLine } from '@/lib/run-in-browser';

/** Languages the ▶ Run button supports, and where each one runs. */
export const RUNNABLE: Record<string, 'browser' | 'runner'> = {
  javascript: 'browser',
  typescript: 'browser',
  csharp: 'runner',
  python: 'runner',
  java: 'runner',
};

const MAX_LINES = 2000;

/** The terminal: runs a file and collects its output. */
export function useRunner() {
  const [lines, setLines] = useState<OutputLine[]>([]);
  const [running, setRunning] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);

  const push = useCallback((line: OutputLine) => {
    setLines((prev) => (prev.length >= MAX_LINES ? prev : [...prev, line]));
  }, []);

  const run = useCallback(async (file: { name: string; language: string; content: string }) => {
    if (stopRef.current) return;
    const language = languageById(file.language);
    const where = RUNNABLE[file.language];
    setLines([{ kind: 'info', text: `$ run ${file.name}` }]);
    if (!where) {
      push({
        kind: 'err',
        text: `${language?.label ?? file.language} files can't be run. Run works for C#, Python, Java, JavaScript and TypeScript.`,
      });
      return;
    }

    setRunning(true);
    const started = performance.now();
    const took = () => `${((performance.now() - started) / 1000).toFixed(2)} s`;
    try {
      if (where === 'browser') {
        const job = runInBrowser(file.language as 'javascript' | 'typescript', file.content, push);
        stopRef.current = job.stop;
        const code = await job.done;
        push({ kind: 'info', text: code === null ? `stopped · ${took()}` : `exited with code ${code} · ${took()}` });
        return;
      }

      push({ kind: 'info', text: `sending to the ${language?.label} runner…` });
      const res = await runCodeAction({ language: file.language, fileName: file.name, content: file.content });
      if (!res.ok) {
        push({ kind: 'err', text: res.error });
        return;
      }
      const r = res.data;
      const text = (s: string, kind: OutputLine['kind']) =>
        s.replace(/\n$/, '').split('\n').forEach((t) => push({ kind, text: t }));
      if (r.compileOutput) text(r.compileOutput, 'err');
      if (r.stdout) text(r.stdout, 'out');
      if (r.stderr) text(r.stderr, 'err');
      if (r.signal === 'SIGKILL') push({ kind: 'err', text: 'Stopped: time or memory limit reached (5 s, 256 MB).' });
      push({ kind: 'info', text: `exited with code ${r.exitCode ?? '?'} · ${r.runtime} · ${took()}` });
    } catch {
      push({ kind: 'err', text: "Couldn't reach the server. Check your connection and try again." });
    } finally {
      stopRef.current = null;
      setRunning(false);
    }
  }, [push]);

  return {
    lines,
    running,
    run,
    stop: () => stopRef.current?.(),
    clear: () => setLines([]),
  };
}
