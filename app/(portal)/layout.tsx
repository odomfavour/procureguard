import Link from 'next/link';
import { Brand } from '@/components/layout/brand';

export const dynamic = 'force-dynamic';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-8">
          <Brand />
          <Link
            href="/dashboard"
            className="text-sm text-ink-soft hover:text-ink"
          >
            Back to buyer view
          </Link>
        </div>
      </header>
      <p className="mx-auto max-w-4xl px-4 pt-4 text-xs text-ink-soft">
        Demo vendor portal · Fictional vendor documents and risk analysis.
      </p>
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-8">
        {children}
      </main>
    </div>
  );
}
