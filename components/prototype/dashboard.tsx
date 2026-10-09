'use client';
import { PageState } from '@/components/ui/page-state';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { listTenders } from '@/lib/api/tenders';
import { Loading } from '@/components/ui/shared';
import { PageLoader } from '@/components/ui/page-loader';
import { useAuth } from '@msflib/react-auth';
import {
  ArrowRight,
  ClipboardList,
  FileText,
  Inbox,
  Package,
  Plus,
  Search,
  type LucideIcon,
} from 'lucide-react';
import { session } from '@/lib/prototype';
import { TenderTable } from './tender-table';
import { Portal, Panel, Heading } from './portal';
import { useData, btn } from './common';

type Stat = {
  label: string;
  count: number;
  hint: string;
  icon: LucideIcon;
};

export function Dashboard({ role }: { role: 'buyer' | 'vendor' }) {
  const auth = useAuth();
  const isLive = auth.status === 'authenticated';
  const query = useQuery({
    queryKey: ['procureguard', 'tenders', auth.me?.id, role, 'dashboard'],
    queryFn: () => listTenders({ role, limit: 20 }),
    enabled: isLive,
  });
  const { db: localDb } = useData();
  const db =
    isLive && localDb
      ? { ...localDb, tenders: [], applications: [], orders: [] }
      : localDb;
  const a = isLive
    ? {
        id: String(auth.me?.id),
        name: auth.me?.username || auth.me?.email || '',
      }
    : db?.accounts.find((x) => x.id === session());
  if (!db || !a)
    return (
      <Portal role={role}>
        <PageLoader fullPage={false} />
      </Portal>
    );
  const buyer = role === 'buyer';
  const tenders = isLive
    ? query.data?.tenders || []
    : buyer
      ? db.tenders.filter((t) => t.buyerId === a.id)
      : db.tenders.filter((t) => t.status === 'open');
  const apps = buyer
    ? db.applications.filter((x) => tenders.some((t) => t.id === x.tenderId))
    : db.applications.filter((x) => x.vendorId === a.id);
  const orders = db.orders.filter((o) =>
    buyer
      ? db.tenders.some((t) => t.id === o.tenderId && t.buyerId === a.id)
      : db.applications.some(
          (x) => x.id === o.applicationId && x.vendorId === a.id
        )
  );

  const stats: Stat[] = [
    {
      label: buyer ? 'Your tenders' : 'Open tenders',
      count: isLive ? (query.data?.total ?? tenders.length) : tenders.length,
      hint:
        isLive && query.data?.total === undefined
          ? 'Tenders on the first page'
          : buyer
            ? 'Tenders you have published'
            : 'Currently accepting bids',
      icon: FileText,
    },
    {
      label: buyer ? 'Applications received' : 'My applications',
      count: apps.length,
      hint: buyer ? 'Vendors awaiting assessment' : 'Bids you have submitted',
      icon: Inbox,
    },
    {
      label: buyer ? 'Active orders' : 'Awarded orders',
      count: orders.length,
      hint: buyer ? 'Orders in progress' : 'Contracts to fulfil',
      icon: Package,
    },
  ];

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
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            href={buyer ? '/tenders/new' : '/vendor/tenders'}
          >
            {buyer ? (
              <Plus className="h-4 w-4" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {buyer ? 'Create tender' : 'Browse tenders'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, count, hint, icon: Icon }) => (
          <Panel key={label}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink-soft">{label}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight">
                  {isLive &&
                  label === (buyer ? 'Your tenders' : 'Open tenders') &&
                  (query.isPending || query.isError)
                    ? '—'
                    : count}
                </p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Icon className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 border-t border-line pt-3 text-xs text-ink-soft">
              {hint}
            </p>
          </Panel>
        ))}
      </div>

      <Panel title={buyer ? 'Recent tenders' : 'Available opportunities'}>
        {isLive && query.isPending ? (
          <Loading />
        ) : isLive && query.isError ? (
          <PageState
            title="Couldn’t load tenders"
            onRetry={() => void query.refetch()}
            backHref={role === 'buyer' ? '/dashboard' : '/vendor/dashboard'}
            backLabel="Back to dashboard"
          />
        ) : tenders.length ? (
          <TenderTable tenders={tenders} role={role} title={''} />
        ) : (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
              <ClipboardList className="h-6 w-6" />
            </span>
            <div>
              <p className="font-semibold">
                {buyer ? 'No tenders yet' : 'No open tenders right now'}
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                {buyer
                  ? 'Create your first tender to start receiving applications.'
                  : 'Check back soon for new opportunities.'}
              </p>
            </div>
            {buyer && (
              <Link
                className={`${btn} inline-flex items-center gap-2`}
                href="/tenders/new"
              >
                <Plus className="h-4 w-4" />
                Create tender
              </Link>
            )}
          </div>
        )}
        {isLive && !!tenders.length && (
          <Link
            className="mt-4 inline-block font-semibold text-brand hover:underline"
            href={buyer ? '/tenders' : '/vendor/tenders'}
          >
            View all tenders →
          </Link>
        )}
      </Panel>
    </Portal>
  );
}
