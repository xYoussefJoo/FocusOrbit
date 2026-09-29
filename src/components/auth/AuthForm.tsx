'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { safeNext } from '@/lib/safe-redirect';

type Mode = 'sign-in' | 'sign-up';

const field =
  'h-11 w-full rounded-lg border border-line bg-raised px-3.5 text-[15px] text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-signal';

export function AuthForm({ mode, next: rawNext }: { mode: Mode; next?: string | string[] }) {
  const next = typeof rawNext === 'string' ? rawNext : undefined;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const signUp = mode === 'sign-up';

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');

    let message: string | null;
    try {
      const { error } = signUp
        ? await authClient.signUp.email({
            name: String(form.get('name') ?? '').trim(),
            email,
            password,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          })
        : await authClient.signIn.email({ email, password });
      message = error ? (error.message ?? 'Something went wrong. Please try again.') : null;
    } catch {
      // A failed request (offline, server down) must not leave the button stuck on "One moment…".
      message = "Couldn't reach the server. Check your connection and try again.";
    }

    if (message) {
      setError(message);
      setPending(false);
      return;
    }
    router.replace(safeNext(next));
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate={false}>
      {signUp && (
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-[13px] font-semibold text-ink-muted">Name</label>
          <input id="name" name="name" required autoComplete="name" className={field} placeholder="Ada Lovelace" />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-[13px] font-semibold text-ink-muted">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" className={field} placeholder="you@example.com" />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-[13px] font-semibold text-ink-muted">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete={signUp ? 'new-password' : 'current-password'}
          className={field}
          placeholder={signUp ? 'At least 8 characters' : '••••••••'}
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-[13px] text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-lg bg-signal text-[15px] font-semibold text-signal-ink transition hover:brightness-110 disabled:opacity-50"
      >
        {pending ? 'One moment…' : signUp ? 'Create account' : 'Sign in'}
      </button>

      <p className="text-center text-[13px] text-ink-muted">
        {signUp ? 'Already have an account?' : 'New to Vesper?'}{' '}
        <Link
          href={`/${signUp ? 'sign-in' : 'sign-up'}${next ? `?next=${encodeURIComponent(next)}` : ''}`}
          className="font-semibold text-ink underline decoration-signal underline-offset-4 hover:text-signal"
        >
          {signUp ? 'Sign in' : 'Create an account'}
        </Link>
      </p>
    </form>
  );
}
