'use client';

import { useEffect, useRef, useState } from 'react';
import { LogOut } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

export function UserMenu({ name, email }: { name: string; email: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('') || '?';

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function signOut() {
    await authClient.signOut(); // deletes the auth_sessions row and clears the cookie
    // A full page load (not a client-side navigation) wipes every in-memory store,
    // so the next person to sign in on this browser never sees this user's data.
    window.location.assign('/');
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account: ${name}`}
        className="size-8 rounded-full bg-raised border border-line text-xs font-semibold text-ink-muted hover:text-ink hover:border-ink-faint transition-colors"
      >
        {initials}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-10 z-50 w-60 rounded-xl border border-line bg-raised p-2 shadow-2xl shadow-black/40">
          <div className="px-3 py-2">
            <p className="text-sm font-semibold truncate">{name}</p>
            <p className="text-xs text-ink-muted truncate">{email}</p>
          </div>
          <div className="my-1 h-px bg-line" />
          <button
            role="menuitem"
            onClick={signOut}
            className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-muted hover:bg-panel hover:text-ink transition-colors"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
