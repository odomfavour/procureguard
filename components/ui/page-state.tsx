'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowLeft, ArrowRight, FileSearch, RotateCcw } from 'lucide-react';

export function PageState({ kind = 'error', title, description, onRetry, backHref = '/', backLabel = 'Back to home', fullPage = false }: {
  kind?: 'error' | 'not-found'; title?: string; description?: string;
  onRetry?: () => void; backHref?: string; backLabel?: string; fullPage?: boolean;
}) {
  const missing = kind === 'not-found';
  const Icon = missing ? FileSearch : AlertTriangle;
  return (
    <section role={missing ? undefined : 'alert'} className={`flex items-center justify-center bg-paper px-5 py-12 ${fullPage ? 'min-h-dvh' : 'min-h-80 rounded-xl'}`}>
      <div className="w-full max-w-md text-center">
        <Link href="/" className="mb-8 inline-block text-xl font-bold text-brand">◈ ProcureGuard</Link>
        <div aria-hidden="true" className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-brand shadow-sm ring-1 ring-line"><Icon size={30} strokeWidth={1.7} /></div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-ink-soft">{missing ? '404 · Page not found' : 'Something went wrong'}</p>
        <h1 className="font-display text-2xl font-bold text-ink">{title || (missing ? 'We couldn’t find that page' : 'We couldn’t load this page')}</h1>
        <p className="mt-3 text-sm leading-6 text-ink-soft">{description || (missing ? 'The link may be outdated, or this page may have moved.' : 'Please try again. If the problem continues, come back in a moment.')}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {onRetry && <button type="button" onClick={onRetry} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"><RotateCcw size={16} />Try again</button>}
          <Link href={backHref} className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${onRetry ? 'border border-line bg-white text-ink hover:bg-brand-tint' : 'bg-brand text-white hover:bg-brand-deep'}`}><ArrowLeft size={16} />{backLabel}</Link>
        </div>
        {fullPage && <Link href="/login" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">Go to sign in<ArrowRight size={14} /></Link>}
      </div>
    </section>
  );
}

export function isNotFoundError(error: unknown) {
  return !!error && typeof error === 'object' && 'status' in error && error.status === 404;
}
