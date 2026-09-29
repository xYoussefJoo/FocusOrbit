'use client';

import { useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Eraser, Square, SquareTerminal } from 'lucide-react';
import type { OutputLine } from '@/lib/run-in-browser';

const LINE_COLOR: Record<OutputLine['kind'], string> = {
  out: 'text-ink',
  err: 'text-danger',
  info: 'text-ink-faint',
};

export function TerminalPanel({ lines, running, open, onToggle, onStop, onClear }: {
  lines: OutputLine[];
  running: boolean;
  open: boolean;
  onToggle: () => void;
  onStop: () => void;
  onClear: () => void;
}) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [lines]);

  return (
    <section aria-label="Terminal" className={`shrink-0 flex flex-col border-t border-line bg-panel ${open ? 'h-56' : 'h-9'}`}>
      <div className="h-9 shrink-0 flex items-center gap-2 px-3">
        <button onClick={onToggle} aria-expanded={open} className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted hover:text-ink">
          <SquareTerminal className="size-4" aria-hidden="true" />
          Terminal
          {open ? <ChevronDown className="size-3.5" aria-hidden="true" /> : <ChevronUp className="size-3.5" aria-hidden="true" />}
        </button>
        {running && <span className="size-1.5 rounded-full bg-signal animate-pulse" aria-label="Running" />}
        <div className="flex-1" />
        {running && (
          <button onClick={onStop} className="h-7 px-2 flex items-center gap-1.5 rounded-md text-xs font-semibold text-danger hover:bg-raised">
            <Square className="size-3" /> Stop
          </button>
        )}
        <button onClick={onClear} aria-label="Clear terminal" title="Clear" className="size-7 flex items-center justify-center rounded-md text-ink-faint hover:bg-raised hover:text-ink">
          <Eraser className="size-3.5" />
        </button>
      </div>
      {open && (
        <div role="log" aria-live="polite" className="flex-1 overflow-auto scrollbar-thin px-4 pb-3 font-mono text-[12.5px] leading-5">
          {lines.length === 0 ? (
            <p className="text-ink-faint">Press ▶ Run (or Ctrl+Enter) to run the open file. Its output appears here.</p>
          ) : (
            lines.map((l, i) => <pre key={i} className={`whitespace-pre-wrap break-words ${LINE_COLOR[l.kind]}`}>{l.text || ' '}</pre>)
          )}
          <div ref={end} />
        </div>
      )}
    </section>
  );
}
