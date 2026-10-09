'use client';
import Link from 'next/link';
import { session } from '@/lib/prototype';
import { TenderTable } from './tender-table';
import { Portal, Panel, Heading } from './portal';
import { useData, btn } from './common';
export function TenderList({ role }: { role: 'buyer' | 'vendor' }) {
  const { db } = useData();
  const a = session();
  const ts = (db?.tenders || []).filter((t) =>
    role === 'buyer' ? t.buyerId === a : t.status === 'open'
  );
  return (
    <Portal role={role}>
      <Heading
        title={role === 'buyer' ? 'Your tenders' : 'Browse tenders'}
        subtitle={
          role === 'buyer'
            ? 'Manage your published procurement opportunities.'
            : 'All published tenders are visible. No automatic matching.'
        }
        action={
          role === 'buyer' ? (
            <Link className={btn} href="/tenders/new">
              + Create tender
            </Link>
          ) : undefined
        }
      />
      <Panel>
        <TenderTable
          tenders={ts}
          role={role}
          title={role === 'buyer' ? 'Your tenders' : 'Browse tenders'}
        />
        {!ts.length && (
          <p className="py-8 text-center text-ink-soft">No tenders found.</p>
        )}
      </Panel>
    </Portal>
  );
}
