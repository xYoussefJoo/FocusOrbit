'use client';

import { loader } from '@monaco-editor/react';

// Runs JavaScript / TypeScript in a Web Worker: a separate thread with no access to the
// page, the editor or the DOM, stopped after TIME_LIMIT_MS. console.* output is sent
// back line by line. TypeScript is first compiled to JavaScript by the TypeScript
// compiler that already ships inside Monaco, so no extra package is needed.

export type OutputLine = { kind: 'out' | 'err' | 'info'; text: string };

const TIME_LIMIT_MS = 5000;

const WORKER_SOURCE = `
const fmt = (v) => {
  if (typeof v === 'string') return v;
  if (v instanceof Error) return v.stack || String(v);
  try { return JSON.stringify(v, null, 2) ?? String(v); } catch { return String(v); }
};
const send = (kind, args) => postMessage({ kind, text: args.map(fmt).join(' ') });
console.log = console.info = console.debug = (...a) => send('out', a);
console.warn = console.error = (...a) => send('err', a);
self.onmessage = async (e) => {
  try {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    await new AsyncFunction(e.data)();
    postMessage({ done: true, code: 0 });
  } catch (err) {
    send('err', [err]);
    postMessage({ done: true, code: 1 });
  }
};
`;

async function compileTypeScript(source: string): Promise<string> {
  const monaco = await loader.init();
  const uri = monaco.Uri.parse(`file:///__run_${Date.now()}.ts`);
  const model = monaco.editor.createModel(source, 'typescript', uri);
  try {
    const getWorker = await monaco.typescript.getTypeScriptWorker();
    const worker = await getWorker(uri);
    const output = await worker.getEmitOutput(uri.toString());
    return output.outputFiles[0]?.text ?? '';
  } finally {
    model.dispose();
  }
}

/**
 * Runs the code and streams output lines to `onLine`. Returns a `stop` function and a
 * promise with the exit code (0 = ok, 1 = error, null = stopped or timed out).
 */
export function runInBrowser(language: 'javascript' | 'typescript', source: string, onLine: (line: OutputLine) => void) {
  let worker: Worker | null = null;
  let finish: (code: number | null) => void = () => {};
  const done = new Promise<number | null>((resolve) => { finish = resolve; });

  const stop = (reason?: string) => {
    if (!worker) return;
    worker.terminate();
    worker = null;
    if (reason) onLine({ kind: 'err', text: reason });
    finish(null);
  };

  (async () => {
    let js = source;
    if (language === 'typescript') {
      try {
        js = await compileTypeScript(source);
      } catch (err) {
        onLine({ kind: 'err', text: `TypeScript compile failed: ${String(err)}` });
        return finish(1);
      }
    }
    const url = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: 'text/javascript' }));
    worker = new Worker(url);
    URL.revokeObjectURL(url);
    const timer = setTimeout(() => stop(`Stopped: still running after ${TIME_LIMIT_MS / 1000} s (an infinite loop?)`), TIME_LIMIT_MS);
    worker.onmessage = (e: MessageEvent<{ kind: OutputLine['kind']; text: string } | { done: true; code: number }>) => {
      if ('done' in e.data) {
        clearTimeout(timer);
        worker?.terminate();
        worker = null;
        finish(e.data.code);
      } else {
        onLine(e.data);
      }
    };
    worker.onerror = (e) => {
      // Syntax errors surface here, before the code even starts.
      e.preventDefault();
      clearTimeout(timer);
      onLine({ kind: 'err', text: e.message });
      stop();
    };
    worker.postMessage(js);
  })();

  return { stop: () => stop('Stopped.'), done };
}
