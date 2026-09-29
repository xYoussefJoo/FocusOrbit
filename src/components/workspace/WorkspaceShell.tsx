'use client';

import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import { Code2, Columns2, FileCode2, FileText, FolderTree, History, ListChecks, NotebookPen, Play, Search, Settings } from 'lucide-react';
import { useSessionSync } from '@/hooks/useFocusSession';
import { useFiles, type SaveState } from '@/hooks/useFiles';
import { RUNNABLE, useRunner } from '@/hooks/useRunner';
import { LANGUAGES, languageById } from '@/lib/languages';
import { useFocusStore } from '@/store/useFocusStore';
import { CodePane } from './CodePane';
import { FilesPanel } from './FilesPanel';
import { FocusHub } from './FocusHub';
import { HistoryPanel } from './HistoryPanel';
import { NotePane } from './NotePane';
import { TasksPanel } from './TasksPanel';
import { TerminalPanel } from './TerminalPanel';
import { UserMenu } from './UserMenu';
import { VesperMark } from './VesperMark';

// The single workspace: every screen lives inside this one shell.
//
//  ┌──────────────────────────── header ────────────────────────────┐
//  │ rail │ side panel │        editor (code | split | notes)       │ focus hub │
//  └──────────────────────────── status ────────────────────────────┘

type Panel = 'files' | 'tasks' | 'history' | 'notes';
type View = 'code' | 'split' | 'notes';

const label = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted';

const SAVE_LABEL: Record<SaveState, string> = {
  saved: 'Saved',
  unsaved: 'Unsaved',
  saving: 'Saving…',
  error: 'Not saved',
  conflict: 'Changed elsewhere',
};

export function WorkspaceShell({ user }: { user: { name: string; email: string } }) {
  const [panel, setPanel] = useState<Panel>('files');
  const [view, setView] = useState<View>('split');
  const code = useFiles();
  const file = code.active;
  const fileLanguage = file ? languageById(file.language) : undefined;
  const runner = useRunner();
  const [terminalOpen, setTerminalOpen] = useState(true);
  const session = useFocusStore((s) => s.session);

  // ▶ Run uses the text in the editor right now, even if it isn't saved yet.
  const runFile = () => {
    if (!file || runner.running) return;
    setTerminalOpen(true);
    void runner.run({ name: file.name, language: file.language, content: code.currentContent() });
  };
  // Monaco registers Ctrl+Enter once per mount, so it calls the latest runFile through a ref.
  const runRef = useRef(runFile);
  useEffect(() => { runRef.current = runFile; });
  const runFromEditor = useCallback(() => runRef.current(), []);
  useSessionSync(); // load the active session once; re-sync when the tab regains focus

  return (
    <div className="h-dvh flex flex-col bg-canvas text-ink overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="h-14 shrink-0 flex items-center justify-between gap-4 px-5 border-b border-line bg-panel">
        <div className="flex items-center gap-3 min-w-0">
          <VesperMark />
          <span className="font-display text-lg font-medium tracking-tight">Vesper</span>
          <span className="text-line" aria-hidden="true">/</span>
          <span className="text-[13px] text-ink-muted truncate">{file?.name ?? 'No file open'}</span>
        </div>

        <div role="group" aria-label="Editor layout" className="hidden md:flex items-center gap-1 p-1 rounded-lg bg-raised">
          <ViewButton icon={Code2} label="Code" active={view === 'code'} onClick={() => setView('code')} />
          <ViewButton icon={Columns2} label="Split" active={view === 'split'} onClick={() => setView('split')} />
          <ViewButton icon={NotebookPen} label="Notes" active={view === 'notes'} onClick={() => setView('notes')} />
        </div>

        <div className="flex items-center gap-3">
          {session && (
            <span className={`hidden sm:flex items-center gap-2 h-7 px-3 rounded-full text-xs font-semibold ${
              session.status === 'running' ? 'bg-signal-soft text-signal' : 'bg-raised text-ink-muted'
            }`}>
              <span className={`size-1.5 rounded-full ${session.status === 'running' ? 'bg-signal animate-pulse' : 'bg-ink-faint'}`} />
              {session.status === 'running' ? 'In session' : 'Paused'}
            </span>
          )}
          <UserMenu name={user.name} email={user.email} />
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* ── Rail ─────────────────────────────────────────────────────── */}
        <nav aria-label="Workspace" className="w-16 shrink-0 flex flex-col items-center gap-2 py-3 border-r border-line bg-panel">
          <RailButton icon={FolderTree} label="Files" active={panel === 'files'} onClick={() => setPanel('files')} />
          <RailButton icon={ListChecks} label="Tasks" active={panel === 'tasks'} onClick={() => setPanel('tasks')} />
          <RailButton icon={History} label="History" active={panel === 'history'} onClick={() => setPanel('history')} />
          <RailButton icon={NotebookPen} label="Notes" active={panel === 'notes'} onClick={() => setPanel('notes')} />
          <RailButton icon={Search} label="Search (coming soon)" disabled />
          <div className="flex-1" />
          <RailButton icon={Settings} label="Settings (coming soon)" disabled />
        </nav>

        {/* ── Side panel ───────────────────────────────────────────────── */}
        <aside className="w-64 shrink-0 hidden md:flex flex-col gap-3 px-3 py-5 border-r border-line bg-panel overflow-y-auto scrollbar-thin">
          {panel === 'files' && (
            <FilesPanel
              files={code.files}
              activeId={file?.id ?? null}
              error={code.error}
              onOpen={code.open}
              onCreateFile={code.create}
              onCreateFolder={code.createFolder}
              onCreateProject={code.createProject}
              onDelete={code.remove}
            />
          )}
          {panel === 'notes' && (
            <EmptyPanel title="Notes" text="Your saved notes will be listed here. Saving notes arrives in roadmap step 5." />
          )}
          {panel === 'tasks' && <TasksPanel />}
          {panel === 'history' && <HistoryPanel />}
        </aside>

        {/* ── Editor area ──────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col min-w-0">
          <div className="h-11 shrink-0 flex items-stretch border-b border-line bg-panel">
            {view !== 'notes' && file && (
              <div className="min-w-0 flex items-center gap-3 px-4 text-[13px] bg-canvas border-r border-line shadow-[inset_0_2px_0_var(--color-signal)]">
                <FileCode2 className="size-4 shrink-0 text-signal" />
                <span className="truncate">{file.name}</span>
                <label htmlFor="file-language" className="sr-only">Change language</label>
                <select
                  id="file-language" value={file.language} onChange={(e) => code.setLanguage(e.target.value)}
                  title="Change the language (the file extension changes too)"
                  className="h-7 rounded-md border border-line bg-raised px-2 text-xs text-ink-muted outline-none focus:border-signal"
                >
                  {LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
                </select>
                <span
                  role="status"
                  className={`shrink-0 text-[11px] ${code.saveState === 'error' || code.saveState === 'conflict' ? 'text-danger' : 'text-ink-faint'}`}
                >
                  {SAVE_LABEL[code.saveState]}
                </span>
                {code.saveState === 'conflict' && (
                  <button onClick={code.reload} className="shrink-0 text-[11px] font-semibold text-signal underline underline-offset-2">
                    Load latest
                  </button>
                )}
              </div>
            )}
            {view !== 'code' && (
              <div className={`flex items-center gap-2 px-4 text-[13px] border-r border-line ${view === 'notes' ? 'bg-canvas text-ink shadow-[inset_0_2px_0_var(--color-signal)]' : 'text-ink-muted'}`}>
                <FileText className="size-4" />
                Session note
              </div>
            )}
            <div className="flex-1" />
            {file && view !== 'notes' && (
              <div className="flex items-center pr-3">
                <button
                  onClick={runFile}
                  disabled={runner.running || !RUNNABLE[file.language]}
                  title={RUNNABLE[file.language] ? 'Run (Ctrl+Enter)' : `${fileLanguage?.label ?? 'This language'} can't be run`}
                  className="h-8 px-3 flex items-center gap-1.5 rounded-lg bg-signal text-signal-ink text-xs font-semibold hover:brightness-110 disabled:opacity-40"
                >
                  <Play className="size-3.5" /> {runner.running ? 'Running…' : 'Run'}
                </button>
              </div>
            )}
          </div>
          {/* Both panes stay mounted and are only hidden, so switching views
              never throws away the editor state or an unsaved note. */}
          <div className="flex-1 flex min-h-0">
            <section
              aria-label="Code editor"
              hidden={view === 'notes'}
              className={`min-w-0 ${view === 'split' ? 'basis-1/2 border-r border-line' : 'flex-1'}`}
            >
              {file ? (
                <CodePane
                  // A fresh editor per open: it always starts from the saved content.
                  key={`${file.id}:${code.openCount}`}
                  path={`${file.id}:${code.openCount}`}
                  language={file.language}
                  value={file.content}
                  onChange={(content) => code.edit(file.id, content)}
                  onSave={code.saveNow}
                  onRun={runFromEditor}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-2 p-8 text-center">
                  <FileCode2 className="size-8 text-ink-faint" aria-hidden="true" />
                  <p className="text-sm text-ink">No file open</p>
                  <p className="max-w-64 text-[13px] leading-6 text-ink-faint">
                    Open a file from the Files panel, or choose <strong className="text-ink-muted">New file</strong> and pick a language.
                  </p>
                </div>
              )}
            </section>
            <div hidden={view === 'code'} className={`min-w-0 ${view === 'split' ? 'basis-1/2' : 'flex-1'}`}>
              <NotePane />
            </div>
          </div>
          {view !== 'notes' && (
            <TerminalPanel
              lines={runner.lines}
              running={runner.running}
              open={terminalOpen}
              onToggle={() => setTerminalOpen(!terminalOpen)}
              onStop={runner.stop}
              onClear={runner.clear}
            />
          )}
        </main>

        <FocusHub />
      </div>

      {/* ── Status bar ─────────────────────────────────────────────────── */}
      <footer className="h-7 shrink-0 flex items-center justify-between px-4 text-[11px] font-mono text-ink-muted border-t border-line bg-panel">
        <span>{fileLanguage ? `${fileLanguage.label} · UTF-8 · ${SAVE_LABEL[code.saveState].toLowerCase()}` : 'no file open'}</span>
        <span>{session ? `session ${session.status}` : 'no active session'}</span>
      </footer>
    </div>
  );
}

type IconType = ComponentType<{ className?: string }>;

function RailButton({ icon: Icon, label, active, disabled, onClick }: {
  icon: IconType; label: string; active?: boolean; disabled?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`size-10 rounded-lg flex items-center justify-center transition-colors disabled:opacity-35 disabled:pointer-events-none ${
        active ? 'bg-signal-soft text-signal' : 'text-ink-muted hover:bg-raised hover:text-ink'
      }`}
    >
      <Icon className="size-5" />
    </button>
  );
}

function ViewButton({ icon: Icon, label, active, onClick }: {
  icon: IconType; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`h-8 px-3 flex items-center gap-2 rounded-md text-xs font-semibold transition-colors ${
        active ? 'bg-panel text-ink' : 'text-ink-muted hover:text-ink'
      }`}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  );
}

function EmptyPanel({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex flex-col gap-2 px-2">
      <span className={label}>{title}</span>
      <p className="text-[13px] leading-6 text-ink-faint">{text}</p>
    </div>
  );
}
