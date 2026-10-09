import { Brand } from '@/components/layout/brand';
import { NavLinks } from '@/components/layout/nav-links';
import { ROLE_LABELS } from '@/lib/constants';
import { initials } from '@/lib/utils';
import type { Session } from '@/types';

export function Topbar({ session }: { session: Session }) {
  const { user, workspace } = session;
  return (
    <header className="border-b border-line bg-surface">
      <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-8">
        <Brand className="lg:hidden" />
        <p className="hidden text-sm font-medium lg:block">{workspace.name}</p>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-tight">{user.name}</p>
            <p className="text-xs text-ink-soft">{ROLE_LABELS[user.role]}</p>
          </div>
          <span
            aria-hidden
            className="grid size-9 place-items-center rounded-full bg-brand-tint text-xs font-semibold text-brand"
          >
            {initials(user.name)}
          </span>
        </div>
      </div>
      <div className="border-t border-line px-4 py-2 lg:hidden">
        <NavLinks orientation="horizontal" />
      </div>
    </header>
  );
}
