'use client';

import { useState } from 'react';

// A draft note beside the code. Saving to the `notes` table (linked to the
// active session) is roadmap step 5, so for now this lives in memory only.
export function NotePane() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  return (
    <section aria-label="Note" className="h-full flex flex-col gap-4 px-9 py-8 bg-panel overflow-y-auto scrollbar-thin">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Session note</span>
        <span className="text-[11px] text-ink-faint">Draft · not saved yet</span>
      </div>
      <label className="sr-only" htmlFor="note-title">Note title</label>
      <input
        id="note-title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What did you learn?"
        className="bg-transparent font-display text-3xl font-medium tracking-tight text-ink placeholder:text-ink-faint outline-none"
      />
      <label className="sr-only" htmlFor="note-body">Note</label>
      <textarea
        id="note-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write while it's fresh. Markdown works."
        className="flex-1 min-h-40 resize-none bg-transparent text-[15px] leading-7 text-ink placeholder:text-ink-faint outline-none"
      />
    </section>
  );
}
