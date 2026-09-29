import Link from 'next/link';
import { VesperMark } from '@/components/workspace/VesperMark';

/** Split screen: the brand on the left, the form on the right (form only on small screens). */
export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh grid lg:grid-cols-2 bg-canvas">
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden border-r border-line bg-panel p-12">
        <Link href="/" className="flex items-center gap-3 w-fit">
          <VesperMark size={28} />
          <span className="font-display text-xl font-medium tracking-tight">Vesper</span>
        </Link>
        {/* Decorative orbit lines, echoing the mark */}
        <svg aria-hidden="true" viewBox="0 0 600 600" className="absolute -right-40 top-1/2 -translate-y-1/2 w-[640px] opacity-60">
          <circle cx="300" cy="300" r="280" fill="none" className="stroke-line" />
          <circle cx="300" cy="300" r="200" fill="none" className="stroke-line" />
          <circle cx="300" cy="300" r="120" fill="none" className="stroke-line" />
          <circle cx="498" cy="102" r="7" className="fill-signal" />
        </svg>
        <div className="relative flex flex-col gap-5 max-w-md">
          <p className="font-display text-4xl font-medium leading-tight tracking-tight">
            Evening focus,<br />engineered.
          </p>
          <p className="text-[15px] leading-7 text-ink-muted">
            Code and notes side by side, a timer that never drifts, and a history of everything you studied.
          </p>
        </div>
      </aside>

      <main className="flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-sm flex flex-col gap-8">
          <Link href="/" className="flex items-center gap-3 lg:hidden">
            <VesperMark size={28} />
            <span className="font-display text-xl font-medium tracking-tight">Vesper</span>
          </Link>
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-3xl font-medium tracking-tight">{title}</h1>
            <p className="text-[15px] text-ink-muted">{subtitle}</p>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
