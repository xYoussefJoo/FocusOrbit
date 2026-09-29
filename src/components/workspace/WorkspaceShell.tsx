'use client';

import { useState, type ComponentType } from 'react';
import { Code2, Columns2, FileCode2, FileText, FolderTree, History, ListChecks, NotebookPen, Search, Settings } from 'lucide-react';
import { dotnetArchitecture, type FileNode } from '@/lib/mockFileTree';
import { useSessionSync } from '@/hooks/useFocusSession';
import { useFocusStore } from '@/store/useFocusStore';
import { CodePane } from './CodePane';
import { FileTree } from './FileTree';
import { FocusHub } from './FocusHub';
import { HistoryPanel } from './HistoryPanel';
import { NotePane } from './NotePane';
import { TasksPanel } from './TasksPanel';
import { UserMenu } from './UserMenu';
import { VesperMark } from './VesperMark';

// The single workspace: every screen lives inside this one shell.
//
//  ┌──────────────────────────── header ────────────────────────────┐
//  │ rail │ side panel │        editor (code | split | notes)       │ focus hub │
//  └──────────────────────────── status ────────────────────────────┘

type Panel = 'files' | 'tasks' | 'history' | 'notes';
type View = 'code' | 'split' | 'notes';

const SAMPLE_CS = `using Microsoft.AspNetCore.Mvc;

namespace Vesper.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SessionsController : ControllerBase
{
    private readonly ISessionService _sessions;

    public SessionsController(ISessionService sessions) => _sessions = sessions;

    [HttpPost("{id}/pause")]
    public async Task<IActionResult> Pause(Guid id)
    {
        // One guarded update: only a running session can be paused.
        var session = await _sessions.PauseAsync(id);
        return session is null ? Conflict() : Ok(session);
    }
}
`;

function languageOf(name: string) {
  if (name.endsWith('.cs')) return 'csharp';
  if (name.endsWith('.ts') || name.endsWith('.tsx')) return 'typescript';
  return 'plaintext';
}

const label = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted';

export function WorkspaceShell({ user }: { user: { name: string; email: string } }) {
  const [panel, setPanel] = useState<Panel>('files');
  const [view, setView] = useState<View>('split');
  const [file, setFile] = useState<FileNode>({ id: 'program', name: 'Program.cs', type: 'file' });
  const session = useFocusStore((s) => s.session);
  useSessionSync(); // load the active session once; re-sync when the tab regains focus

  return (
    <div className="h-dvh flex flex-col bg-canvas text-ink overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="h-14 shrink-0 flex items-center justify-between gap-4 px-5 border-b border-line bg-panel">
        <div className="flex items-center gap-3 min-w-0">
          <VesperMark />
          <span className="font-display text-lg font-medium tracking-tight">Vesper</span>
          <span className="text-line" aria-hidden="true">/</span>
          <span className="text-[13px] text-ink-muted truncate">{file.name}</span>
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
            <>
              <div className="flex items-baseline justify-between px-2">
                <span className={label}>Files</span>
                <span className="text-[11px] text-ink-faint">Sample project</span>
              </div>
              <FileTree nodes={dotnetArchitecture} activeId={file.id} onOpen={setFile} />
            </>
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
            {view !== 'notes' && (
              <div className="flex items-center gap-2 px-4 text-[13px] bg-canvas border-r border-line shadow-[inset_0_2px_0_var(--color-signal)]">
                <FileCode2 className="size-4 text-signal" />
                {file.name}
              </div>
            )}
            {view !== 'code' && (
              <div className={`flex items-center gap-2 px-4 text-[13px] border-r border-line ${view === 'notes' ? 'bg-canvas text-ink shadow-[inset_0_2px_0_var(--color-signal)]' : 'text-ink-muted'}`}>
                <FileText className="size-4" />
                Session note
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
              <CodePane path={file.id} language={languageOf(file.name)} value={SAMPLE_CS} />
            </section>
            <div hidden={view === 'code'} className={`min-w-0 ${view === 'split' ? 'basis-1/2' : 'flex-1'}`}>
              <NotePane />
            </div>
          </div>
        </main>

        <FocusHub />
      </div>

      {/* ── Status bar ─────────────────────────────────────────────────── */}
      <footer className="h-7 shrink-0 flex items-center justify-between px-4 text-[11px] font-mono text-ink-muted border-t border-line bg-panel">
        <span>{languageOf(file.name)} · UTF-8</span>
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
