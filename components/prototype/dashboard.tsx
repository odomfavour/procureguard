'use client';
import Link from 'next/link';
import { session } from '@/lib/prototype';
import { TenderTable } from './tender-table';
import { Portal, Panel, Heading } from './portal';
import { useData, btn } from './common';
export function Dashboard({ role }: { role: 'buyer' | 'vendor' }) {
  const { db } = useData();
  const a = db?.accounts.find((x) => x.id === session());
  if (!db || !a) return null;
  const buyer = role === 'buyer';
  const tenders = buyer
    ? db.tenders.filter((t) => t.buyerId === a.id)
    : db.tenders.filter((t) => t.status === 'open');
  const apps = buyer
    ? db.applications.filter((x) => tenders.some((t) => t.id === x.tenderId))
    : db.applications.filter((x) => x.vendorId === a.id);
  return (
    <Portal role={role}>
      <Heading
        title={`Welcome back, ${a.name.split(' ')[0]}`}
        subtitle={
          buyer
            ? 'Manage tenders, assess applications and secure procurement payments.'
            : 'Discover opportunities, track applications and manage fulfillment.'
        }
        action={
          <Link
            className={btn}
            href={buyer ? '/tenders/new' : '/vendor/tenders'}
          >
            {buyer ? 'Create tender' : 'Browse tenders'} →
          </Link>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          [buyer ? 'Your tenders' : 'Open tenders', tenders.length],
          [buyer ? 'Applications received' : 'My applications', apps.length],
          [
            buyer ? 'Active orders' : 'Awarded orders',
            db.orders.filter((o) =>
              buyer
                ? db.tenders.some(
                    (t) => t.id === o.tenderId && t.buyerId === a.id
                  )
                : db.applications.some(
                    (x) => x.id === o.applicationId && x.vendorId === a.id
                  )
            ).length,
          ],
        ].map(([label, count]) => (
          <Panel key={label as string}>
            <p className="text-sm text-ink-soft">{label}</p>
            <p className="mt-2 text-3xl font-bold">{count}</p>
          </Panel>
        ))}
      </div>
      <Panel title={buyer ? 'Recent tenders' : 'Available opportunities'}>
        <TenderTable
          tenders={tenders}
          role={role}
          title={buyer ? 'Recent tenders' : 'Available opportunities'}
        />
      </Panel>
    </Portal>
  );
}
