'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@msflib/react-auth';
import { useQuery } from '@tanstack/react-query';
import { listTenders } from '@/lib/api/tenders';
import { Loading } from '@/components/ui/shared';
import { session } from '@/lib/prototype';
import { TenderTable } from './tender-table';
import { Portal, Panel, Heading } from './portal';
import { useData, btn } from './common';
export function TenderList({ role }: { role: 'buyer' | 'vendor' }) {
  const auth = useAuth();
  const live = auth.status === 'authenticated';
  const [status, setStatus] = useState<'' | 'active' | 'closed'>('');
  const [offset, setOffset] = useState(0);
  const limit = 20;
  const query = useQuery({
    queryKey: ['procureguard', 'tenders', auth.me?.id, role, status, offset, limit],
    queryFn: () => listTenders({ role, status: status || undefined, offset, limit }),
    enabled: live,
  });
  const { db } = useData();
  const a = session();
  const ts = live ? query.data?.tenders || [] : (db?.tenders || []).filter((t) =>
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
        {live && role === 'buyer' && (
          <label className="mb-4 flex items-center gap-3 text-sm font-medium">
            Status
            <select className="rounded-lg border border-line bg-white px-3 py-2" value={status} onChange={(event) => { setStatus(event.target.value as '' | 'active' | 'closed'); setOffset(0); }}>
              <option value="">All tenders</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </label>
        )}
        {live && query.isPending ? <Loading /> : live && query.isError ? (
          <p role="alert" className="py-6 text-risk-high">{query.error.message} <button type="button" className="underline" onClick={() => void query.refetch()}>Retry</button></p>
        ) : <>
        <TenderTable
          tenders={ts}
          role={role}
          title={role === 'buyer' ? 'Your tenders' : 'Browse tenders'}
        />
        {!ts.length && (
          <p className="py-8 text-center text-ink-soft">No tenders found.</p>
        )}
        </>}
        {live && !query.isError && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-sm">
            <span>{ts.length ? `${offset + 1}–${offset + ts.length}` : '0'}{query.data?.total !== undefined ? ` of ${query.data.total}` : ''}</span>
            <div className="flex gap-2">
              <button type="button" className={btn} disabled={offset === 0 || query.isFetching} onClick={() => setOffset((value) => Math.max(0, value - limit))}>Previous</button>
              <button type="button" className={btn} disabled={query.isFetching || (query.data?.total !== undefined ? offset + ts.length >= query.data.total : ts.length < limit)} onClick={() => setOffset((value) => value + limit)}>Next</button>
            </div>
          </div>
        )}
      </Panel>
    </Portal>
  );
}
