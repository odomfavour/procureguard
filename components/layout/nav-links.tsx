'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface NavLinksProps {
  orientation: 'vertical' | 'horizontal';
}

export function NavLinks({ orientation }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className={cn(
        'flex gap-1',
        orientation === 'vertical' ? 'flex-col' : 'overflow-x-auto'
      )}
    >
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              orientation === 'vertical'
                ? active
                  ? 'bg-white/10 text-white'
                  : 'text-white/65 hover:bg-white/5 hover:text-white'
                : active
                  ? 'bg-brand-tint text-brand'
                  : 'text-ink-soft hover:bg-paper hover:text-ink'
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="whitespace-nowrap">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
