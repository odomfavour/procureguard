'use client';
import { PageState } from '@/components/ui/page-state';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@msflib/react-auth';
import { useQuery } from '@tanstack/react-query';
import { listAllTenders } from '@/lib/api/tenders';
import { Loading } from '@/components/ui/shared';
import { session } from '@/lib/prototype';
import { TenderTable } from './tender-table';
import { Portal, Panel, Heading } from './portal';
import { useData } from './common';
export function TenderList({ role }: { role: 'buyer' | 'vendor' }) {
  const auth = useAuth();
  const live = auth.status === 'authenticated';
  const [status, setStatus] = useState<'' | 'active' | 'closed'>('');
  const query = useQuery({
    queryKey: ['procureguard', 'tenders', auth.me?.id, role, status],
    queryFn: () => listAllTenders({ role, status: status || undefined }),
    enabled: live,
  });
  const { db } = useData();
  const a = session();
  const ts = live
    ? query.data?.tenders || []
    : (db?.tenders || []).filter((t) =>
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
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              href="/tenders/new"
            >
              + Create tender
            </Link>
          ) : undefined
        }
      />
      <Panel>
        {live && role === 'buyer' && (
          <label className="mb-4 flex items-center gap-3 text-sm font-medium">
            Status
            <select
              className="rounded-lg border border-line bg-white px-3 py-2"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as '' | 'active' | 'closed');
              }}
            >
              <option value="">All tenders</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </label>
        )}
        {live && query.isPending ? (
          <Loading />
        ) : live && query.isError ? (
          <PageState
            title="Couldn’t load tenders"
            onRetry={() => void query.refetch()}
            backHref={role === 'buyer' ? '/dashboard' : '/vendor/dashboard'}
            backLabel="Back to dashboard"
          />
        ) : (
          <>
            <TenderTable tenders={ts} role={role} title={''} />
            {!ts.length && (
              <p className="py-8 text-center text-ink-soft">
                No tenders found.
              </p>
            )}
          </>
        )}
      </Panel>
    </Portal>
  );
}
