'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export function LandingHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#101e42]/95 backdrop-blur-md sm:static sm:border-0">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 px-5 py-4 sm:px-8 sm:py-7">
        <Link href="/" onClick={() => setOpen(false)} aria-label="ProcureGuard home" className="shrink-0 text-xl font-bold sm:text-2xl">◈ ProcureGuard</Link>
        <button
          type="button"
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          aria-expanded={open}
          aria-controls="landing-navigation"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/20 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:hidden"
        >
          {open ? <X size={23} /> : <Menu size={23} />}
        </button>
        <nav
          id="landing-navigation"
          aria-label="Account navigation"
          className={`${open ? 'flex' : 'hidden'} w-full flex-col gap-3 border-t border-white/10 pt-4 mt-4 sm:mt-0 sm:flex sm:w-auto sm:flex-row sm:border-0 sm:pt-0`}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setOpen(false);
              document.querySelector<HTMLButtonElement>('[aria-controls="landing-navigation"]')?.focus();
            }
          }}
        >
          <Link href="/login" onClick={() => setOpen(false)} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/30 px-4 py-2 text-sm transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Sign in</Link>
          <Link href="/register" onClick={() => setOpen(false)} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#101e42] transition-colors hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Get started</Link>
        </nav>
      </div>
    </header>
  );
}
