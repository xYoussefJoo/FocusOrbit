'use client';

import { useMemo, useState } from 'react';
import { ChevronRight, FileCode2, FilePlus2, Folder, FolderOpen, FolderPlus, Layers, Trash2, X } from 'lucide-react';
import { LANGUAGES, languageById, withExtension } from '@/lib/languages';
import type { FileSummary } from '@/data/files';

const label = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted';
const control =
  'h-9 w-full min-w-0 rounded-lg border border-line bg-raised px-3 text-[13px] text-ink placeholder:text-ink-faint outline-none focus:border-signal';

type Created = { ok: true } | { error: string };
type Mode = 'file' | 'folder' | 'project' | null;

type Props = {
  files: FileSummary[] | null;
  activeId: string | null;
  error: string | null;
  onOpen: (id: string) => void;
  onCreateFile: (name: string, language: string, parentId: string | null) => Promise<Created>;
  onCreateFolder: (name: string, parentId: string | null) => Promise<Created>;
  onCreateProject: (name: string, template: 'empty' | 'clean-architecture') => Promise<Created>;
  onDelete: (id: string) => void;
};

export function FilesPanel({ files, activeId, error, onOpen, onCreateFile, onCreateFolder, onCreateProject, onDelete }: Props) {
  const [mode, setMode] = useState<Mode>(null);
  // Where "New file / New folder" goes: the folder you last clicked (null = top level).
  const [target, setTarget] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

  const children = useMemo(() => {
    const map = new Map<string | null, FileSummary[]>();
    for (const f of files ?? []) map.set(f.parentId, [...(map.get(f.parentId) ?? []), f]);
    return map;
  }, [files]);
  const byId = useMemo(() => new Map((files ?? []).map((f) => [f.id, f])), [files]);
  const targetFolder = target ? byId.get(target) : undefined;

  function pathOf(id: string | null): string {
    const parts: string[] = [];
    for (let f = id ? byId.get(id) : undefined; f; f = f.parentId ? byId.get(f.parentId) : undefined) parts.unshift(f.name);
    return parts.join(' / ');
  }

  function toggle(id: string) {
    setCollapsed((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function renderLevel(parentId: string | null, depth: number): React.ReactNode {
    return (children.get(parentId) ?? []).map((node) => {
      const isFolder = node.kind === 'folder';
      const isOpen = isFolder && !collapsed.has(node.id);
      const selected = isFolder ? node.id === target : node.id === activeId;
      return (
        <li key={node.id}>
          <div className="group flex items-center gap-1">
            <button
              onClick={() => {
                if (isFolder) {
                  // First click selects the folder as the place for new items; clicking it again folds it.
                  if (node.id === target) toggle(node.id); else { setTarget(node.id); setCollapsed((s) => { const n = new Set(s); n.delete(node.id); return n; }); }
                } else {
                  setTarget(node.parentId);
                  onOpen(node.id);
                }
              }}
              aria-expanded={isFolder ? isOpen : undefined}
              aria-current={!isFolder && node.id === activeId ? 'true' : undefined}
              style={{ paddingLeft: 8 + depth * 14 }}
              className={`min-w-0 flex-1 flex items-center gap-1.5 rounded-lg pr-2 py-1 text-left text-[13px] transition-colors ${
                selected ? 'bg-signal-soft text-ink' : 'text-ink-muted hover:bg-raised hover:text-ink'
              }`}
            >
              {isFolder ? (
                <>
                  <ChevronRight className={`size-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`} aria-hidden="true" />
                  {isOpen ? <FolderOpen className="size-4 shrink-0 text-signal/80" /> : <Folder className="size-4 shrink-0 text-signal/80" />}
                </>
              ) : (
                <>
                  <span className="w-3.5 shrink-0" aria-hidden="true" />
                  <FileCode2 className={`size-4 shrink-0 ${node.id === activeId ? 'text-signal' : ''}`} />
                </>
              )}
              <span className="truncate">{node.name}</span>
              {!isFolder && (
                <span className="ml-auto shrink-0 text-[10px] font-mono text-ink-faint">{languageById(node.language)?.label ?? node.language}</span>
              )}
            </button>
            <button
              onClick={() => {
                const what = isFolder ? `the folder ${node.name} and everything in it` : node.name;
                if (window.confirm(`Delete ${what}? This can't be undone.`)) {
                  if (target && (target === node.id || pathOf(target).startsWith(`${pathOf(node.id)} /`))) setTarget(null);
                  onDelete(node.id);
                }
              }}
              aria-label={`Delete ${node.name}`}
              className="size-7 shrink-0 rounded-md flex items-center justify-center text-ink-faint opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-danger hover:bg-raised"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
          {isOpen && (children.get(node.id)?.length ?? 0) > 0 && <ul>{renderLevel(node.id, depth + 1)}</ul>}
        </li>
      );
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-2">
        <span className={label}>Files</span>
        <div className="flex items-center gap-0.5">
          <ModeButton icon={FilePlus2} label="New file" active={mode === 'file'} onClick={() => setMode(mode === 'file' ? null : 'file')} />
          <ModeButton icon={FolderPlus} label="New folder" active={mode === 'folder'} onClick={() => setMode(mode === 'folder' ? null : 'folder')} />
          <ModeButton icon={Layers} label="New project" active={mode === 'project'} onClick={() => setMode(mode === 'project' ? null : 'project')} />
        </div>
      </div>

      {mode && (
        <CreateForm
          key={mode}
          mode={mode}
          location={mode === 'project' ? null : targetFolder ? pathOf(targetFolder.id) : null}
          onClearLocation={() => setTarget(null)}
          onCancel={() => setMode(null)}
          onSubmit={async (name, extra) => {
            const res = mode === 'file'
              ? await onCreateFile(name, extra, target)
              : mode === 'folder'
                ? await onCreateFolder(name, target)
                : await onCreateProject(name, extra as 'empty' | 'clean-architecture');
            if ('ok' in res) setMode(null);
            return res;
          }}
        />
      )}

      {error && <p role="alert" className="px-2 text-xs text-danger">{error}</p>}

      {!files ? (
        <div className="mx-2 h-24 rounded-lg bg-raised animate-pulse" aria-hidden="true" />
      ) : files.length === 0 ? (
        <p className="px-2 text-[13px] leading-6 text-ink-faint">
          Nothing here yet. Start a <strong className="text-ink-muted">New project</strong> (with a Clean Architecture layout if you like),
          or a single <strong className="text-ink-muted">New file</strong>. Everything saves automatically.
        </p>
      ) : (
        <ul className="flex flex-col gap-px">{renderLevel(null, 0)}</ul>
      )}
    </div>
  );
}

function ModeButton({ icon: Icon, label: text, active, onClick }: {
  icon: React.ComponentType<{ className?: string }>; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick} aria-label={text} title={text} aria-pressed={active}
      className={`size-7 rounded-md flex items-center justify-center transition-colors ${active ? 'bg-signal-soft text-signal' : 'text-ink-muted hover:bg-raised hover:text-ink'}`}
    >
      <Icon className="size-4" />
    </button>
  );
}

function CreateForm({ mode, location, onClearLocation, onCancel, onSubmit }: {
  mode: Exclude<Mode, null>;
  location: string | null;
  onClearLocation: () => void;
  onCancel: () => void;
  onSubmit: (name: string, extra: string) => Promise<Created>;
}) {
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('csharp');
  const [template, setTemplate] = useState('clean-architecture');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lang = languageById(language)!;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    const res = await onSubmit(name, mode === 'file' ? language : template);
    setBusy(false);
    if ('error' in res) setError(res.error);
  }

  const title = mode === 'file' ? 'New file' : mode === 'folder' ? 'New folder' : 'New project';
  const hint = mode === 'file'
    ? name.trim() ? `Creates ${withExtension(name, lang)}` : `.${lang.ext} is added for you`
    : mode === 'project'
      ? template === 'clean-architecture' ? 'Domain, Application, Infrastructure and Api layers' : 'An empty top-level folder'
      : null;

  return (
    <form onSubmit={submit} onKeyDown={(e) => e.key === 'Escape' && onCancel()} className="flex flex-col gap-2 rounded-lg border border-line bg-canvas/40 p-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-ink">{title}</span>
        <button type="button" onClick={onCancel} aria-label="Cancel" className="size-6 rounded flex items-center justify-center text-ink-faint hover:text-ink">
          <X className="size-3.5" />
        </button>
      </div>
      {mode !== 'project' && (
        <p className="flex items-center gap-1 text-[11px] text-ink-muted">
          in <span className="truncate font-mono text-ink">{location ?? 'top level'}</span>
          {location && (
            <button type="button" onClick={onClearLocation} className="shrink-0 underline underline-offset-2 hover:text-ink">top level</button>
          )}
        </p>
      )}
      {mode === 'file' && (
        <>
          <label htmlFor="new-file-language" className="sr-only">Language</label>
          <select id="new-file-language" value={language} onChange={(e) => setLanguage(e.target.value)} className={control}>
            {LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
        </>
      )}
      {mode === 'project' && (
        <>
          <label htmlFor="new-project-template" className="sr-only">Template</label>
          <select id="new-project-template" value={template} onChange={(e) => setTemplate(e.target.value)} className={control}>
            <option value="clean-architecture">Clean Architecture (.NET)</option>
            <option value="empty">Empty project</option>
          </select>
        </>
      )}
      <label htmlFor={`new-${mode}-name`} className="sr-only">{title} name</label>
      <input
        id={`new-${mode}-name`} autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={80}
        placeholder={mode === 'file' ? 'e.g. Program' : mode === 'folder' ? 'e.g. Services' : 'e.g. Shop'}
        className={control}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-ink-faint truncate">{hint}</span>
        <button type="submit" disabled={busy || !name.trim()} className="h-8 px-3 shrink-0 rounded-lg bg-signal text-signal-ink text-xs font-semibold hover:brightness-110 disabled:opacity-40">
          Create
        </button>
      </div>
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
    </form>
  );
}
