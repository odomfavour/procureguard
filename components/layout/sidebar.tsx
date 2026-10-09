import Link from 'next/link';
import { Store } from 'lucide-react';
import { Brand } from '@/components/layout/brand';
import { NavLinks } from '@/components/layout/nav-links';

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col justify-between bg-ink px-4 py-5 text-white lg:flex">
      <div className="flex flex-col gap-8">
        <Brand />
        <NavLinks orientation="vertical" />
      </div>
      <Link
        href="/vendor-portal"
        className="flex items-center gap-3 rounded-md border border-white/15 px-3 py-2 text-sm text-white/75 transition-colors hover:bg-white/5 hover:text-white"
      >
        <Store className="size-4" aria-hidden />
        Preview vendor portal
      </Link>
    </aside>
  );
}
