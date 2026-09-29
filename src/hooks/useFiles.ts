'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createFileAction,
  createFolderAction,
  createProjectAction,
  deleteFileAction,
  getFileAction,
  listFilesAction,
  saveFileAction,
} from '@/app/actions/files';
import type { FileDTO, FileSummary } from '@/data/files';

export type SaveState = 'saved' | 'unsaved' | 'saving' | 'error' | 'conflict';
type Created = { ok: true } | { error: string };

const NETWORK = "Couldn't reach the server. Check your connection and try again.";
const AUTOSAVE_MS = 1000;

const byFolderThenName = (a: FileSummary, b: FileSummary) =>
  a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'folder' ? -1 : 1;

/** Ids of a folder and everything below it (the list is flat; parentId links it). */
function subtreeIds(list: FileSummary[], rootId: string): Set<string> {
  const ids = new Set([rootId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const f of list) {
      if (f.parentId && ids.has(f.parentId) && !ids.has(f.id)) { ids.add(f.id); grew = true; }
    }
  }
  return ids;
}

/**
 * The workspace's files and folders: list, open, create, delete, and autosave.
 *
 * Typing never waits for the network. Each change is kept as `pending` and saved
 * AUTOSAVE_MS after you stop typing (or right away on Ctrl+S / switching files).
 * Only one save runs at a time, and each save sends the version it was based on,
 * so a stale tab gets "conflict" instead of overwriting newer work.
 */
export function useFiles() {
  const [files, setFiles] = useState<FileSummary[] | null>(null);
  const [active, setActive] = useState<FileDTO | null>(null);
  // Bumped on every open, so the editor remounts with the file's saved content.
  const [openCount, setOpenCount] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [error, setError] = useState<string | null>(null);

  const version = useRef(new Map<string, string>()); // fileId → updatedAt the editor is based on
  const pending = useRef<{ id: string; content: string } | null>(null);
  const latest = useRef(''); // the open file's text right now, saved or not (for ▶ Run)
  const inFlight = useRef<Promise<void> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    listFilesAction()
      .then((res) => (res.ok ? setFiles(res.data) : setError(res.error)))
      .catch(() => setError(NETWORK));
  }, []);

  /** A save succeeded: remember the new version and refresh the list entry. */
  const touch = useCallback((summary: FileSummary) => {
    version.current.set(summary.id, summary.updatedAt);
    setFiles((list) => list?.map((f) => (f.id === summary.id ? summary : f)).sort(byFolderThenName) ?? list);
  }, []);

  /** Saves whatever is pending now. Resolves when nothing is left to save (or a save failed). */
  const flush = useCallback(async (): Promise<void> => {
    clearTimeout(timer.current);
    if (inFlight.current) await inFlight.current;
    const next = pending.current;
    if (!next) return;
    pending.current = null;
    setSaveState('saving');

    inFlight.current = (async () => {
      try {
        const res = await saveFileAction(next.id, { content: next.content }, version.current.get(next.id) ?? '');
        if (res.ok) {
          touch(res.data);
          setError(null);
          setSaveState(pending.current ? 'unsaved' : 'saved');
        } else {
          setError(res.error);
          setSaveState(res.code === 'CONFLICT' ? 'conflict' : 'error');
          if (res.code !== 'CONFLICT') pending.current ??= next; // retry on the next edit or Ctrl+S
        }
      } catch {
        pending.current ??= next;
        setError(NETWORK);
        setSaveState('error');
      }
    })();
    await inFlight.current;
    inFlight.current = null;
    // Typed more while that save was running: save the newest text too.
    if (pending.current) await flush();
  }, [touch]);

  /** Called on every keystroke. */
  const edit = useCallback((fileId: string, content: string) => {
    latest.current = content;
    pending.current = { id: fileId, content };
    setSaveState((s) => (s === 'conflict' ? s : 'unsaved'));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), AUTOSAVE_MS);
  }, [flush]);

  const show = useCallback((file: FileDTO) => {
    version.current.set(file.id, file.updatedAt);
    latest.current = file.content;
    setActive(file);
    setOpenCount((n) => n + 1);
    setSaveState('saved');
    setError(null);
  }, []);

  const open = useCallback(async (fileId: string) => {
    await flush();
    try {
      const res = await getFileAction(fileId);
      if (!res.ok) return setError(res.error);
      show(res.data);
    } catch {
      setError(NETWORK);
    }
  }, [flush, show]);

  const create = useCallback(async (name: string, language: string, parentId: string | null): Promise<Created> => {
    await flush();
    try {
      const res = await createFileAction({ name, language, parentId });
      if (!res.ok) return { error: res.error };
      const { content, ...summary } = res.data;
      setFiles((list) => [...(list ?? []), summary].sort(byFolderThenName));
      show({ ...summary, content });
      return { ok: true };
    } catch {
      return { error: NETWORK };
    }
  }, [flush, show]);

  const createFolder = useCallback(async (name: string, parentId: string | null): Promise<Created> => {
    try {
      const res = await createFolderAction({ name, parentId });
      if (!res.ok) return { error: res.error };
      setFiles((list) => [...(list ?? []), res.data].sort(byFolderThenName));
      return { ok: true };
    } catch {
      return { error: NETWORK };
    }
  }, []);

  const createProject = useCallback(async (name: string, template: 'empty' | 'clean-architecture'): Promise<Created> => {
    try {
      const res = await createProjectAction({ name, template });
      if (!res.ok) return { error: res.error };
      setFiles((list) => [...(list ?? []), ...res.data].sort(byFolderThenName));
      return { ok: true };
    } catch {
      return { error: NETWORK };
    }
  }, []);

  /** Deletes a file, or a folder and everything in it. */
  const remove = useCallback(async (id: string) => {
    const gone = subtreeIds(files ?? [], id);
    if (pending.current && gone.has(pending.current.id)) pending.current = null; // no point saving it
    try {
      const res = await deleteFileAction(id);
      if (!res.ok) return setError(res.error);
      setFiles((list) => list?.filter((f) => !gone.has(f.id)) ?? list);
      gone.forEach((g) => version.current.delete(g));
      setActive((a) => (a && gone.has(a.id) ? null : a));
    } catch {
      setError(NETWORK);
    }
  }, [files]);

  /** Switches the open file's language; its extension follows (Program.cs → Program.py). */
  const setLanguage = useCallback(async (language: string) => {
    if (!active) return;
    await flush();
    try {
      const res = await saveFileAction(active.id, { language }, version.current.get(active.id) ?? '');
      if (!res.ok) {
        setError(res.error);
        if (res.code === 'CONFLICT') setSaveState('conflict');
        return;
      }
      touch(res.data);
      setError(null);
      setActive((a) => (a && a.id === res.data.id ? { ...a, language: res.data.language, name: res.data.name } : a));
    } catch {
      setError(NETWORK);
    }
  }, [active, flush, touch]);

  // Don't lose the last second of typing: save when the tab is hidden, and warn
  // before closing the page while a save is still pending.
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') void flush(); };
    const onUnload = (e: BeforeUnloadEvent) => { if (pending.current || inFlight.current) e.preventDefault(); };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('beforeunload', onUnload);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('beforeunload', onUnload);
    };
  }, [flush]);

  return {
    files, active, openCount, saveState, error,
    open, create, createFolder, createProject, remove, edit, setLanguage,
    saveNow: flush,
    /** The open file's current text, including unsaved typing. */
    currentContent: () => latest.current,
    /** After a conflict: throw away local changes and load the latest saved version. */
    reload: () => { pending.current = null; return active ? open(active.id) : Promise.resolve(); },
  };
}
