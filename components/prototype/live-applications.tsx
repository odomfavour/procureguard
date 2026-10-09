'use client';
import { PageState, isNotFoundError } from '@/components/ui/page-state';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@msflib/react-auth';
import { useQuery } from '@tanstack/react-query';
import { getApplication, listApplications } from '@/lib/api/applications';
import { DataTable } from '@/components/msflib/data-table';
import { Loading } from '@/components/ui/shared';
import { money } from '@/lib/prototype';
import { Portal, Panel, Heading } from './portal';
import { btn } from './common';

export function LiveApplications() {
  const auth = useAuth();
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState('');
  const [tenderId, setTenderId] = useState('');
  const query = useQuery({
    queryKey: ['procureguard', 'applications', auth.me?.id, offset, status, tenderId],
    queryFn: () => listApplications({ offset, limit: 20, status: status || undefined, tenderId: tenderId || undefined }),
  });
  const rows = query.data?.applications || [];
  return <Portal role="vendor">
    <Heading title="My applications" subtitle="Track submitted bids and procurement decisions." />
    <Panel>
      <div className="mb-4 flex flex-wrap gap-4">
        <label className="text-sm font-medium">Status<input className="ml-2 rounded-lg border border-line px-3 py-2" placeholder="All statuses" value={status} onChange={(event) => { setStatus(event.target.value); setOffset(0); }} /></label>
        <label className="text-sm font-medium">Tender ID<input className="ml-2 rounded-lg border border-line px-3 py-2" type="number" min="1" placeholder="All tenders" value={tenderId} onChange={(event) => { setTenderId(event.target.value); setOffset(0); }} /></label>
      </div>
      {query.isPending ? <Loading /> : query.isError ? <PageState title="Couldn’t load your applications" onRetry={() => void query.refetch()} backHref="/vendor/dashboard" backLabel="Back to dashboard" /> : <>
        <DataTable rows={rows} title="My applications" columns={[
          { field: 'title', headerName: 'Tender', minWidth: 220, flex: 1 },
          { field: 'price', headerName: 'Bid price', width: 160, renderCell: ({ row }) => row.price === null ? '—' : money(row.price) },
          { field: 'status', headerName: 'Status', width: 140 },
          { field: 'id', headerName: 'Application', width: 190, renderCell: ({ row }) => <Link className="font-semibold text-brand hover:underline" href={`/vendor/applications/${row.id}`}>View application</Link> },
          { field: 'tenderId', headerName: 'Tender details', width: 160, renderCell: ({ row }) => <Link className="text-brand hover:underline" href={`/vendor/tenders/${row.tenderId}`}>View tender</Link> },
        ]} />
        {!rows.length && <p className="py-6 text-center text-ink-soft">No applications found.</p>}
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4 text-sm">
          <span>{rows.length ? `${offset + 1}–${offset + rows.length}` : '0'}{query.data.total !== undefined ? ` of ${query.data.total}` : ''}</span>
          <div className="flex gap-2">
            <button className={btn} disabled={offset === 0 || query.isFetching} onClick={() => setOffset((value) => Math.max(0, value - 20))}>Previous</button>
            <button className={btn} disabled={query.isFetching || (query.data.total !== undefined ? offset + rows.length >= query.data.total : rows.length < 20)} onClick={() => setOffset((value) => value + 20)}>Next</button>
          </div>
        </div>
      </>}
    </Panel>
  </Portal>;
}

export function LiveApplicationDetail({ id, role }: { id: string; role: 'buyer' | 'vendor' }) {
  const auth = useAuth();
  const query = useQuery({ queryKey: ['procureguard', 'applications', auth.me?.id, 'detail', id], queryFn: () => getApplication(id), enabled: auth.status === 'authenticated' });
  const application = query.data;
  return <Portal role={role}>
    {query.isPending ? <Loading /> : query.isError ? <PageState kind={isNotFoundError(query.error) ? "not-found" : "error"} title={isNotFoundError(query.error) ? "Application not found" : "Couldn’t load this application"} onRetry={isNotFoundError(query.error) ? undefined : () => void query.refetch()} backHref={role === "vendor" ? "/vendor/applications" : "/tenders"} backLabel={role === "vendor" ? "Back to applications" : "Back to tenders"} /> : application && <>
      <Heading title={application.title} subtitle={`Application #${application.id} · ${application.status}`} />
      <Panel title="Submission">
        <div className="mb-5 flex flex-wrap gap-6 text-sm"><p>Proposed price: <strong>{application.price === null ? '—' : money(application.price)}</strong></p><p>Delivery timeline: <strong>{application.deliveryDays === null ? '—' : `${application.deliveryDays} days`}</strong></p></div>
        <DataTable title="Requirement responses" rows={Object.entries(application.responses).map(([id, response]) => ({ id, requirement: id, response }))} columns={[{ field: 'requirement', headerName: 'Requirement', minWidth: 200, flex: 1 }, { field: 'response', headerName: 'Response', minWidth: 220, flex: 2 }]} />
        <div className="mt-5"><DataTable title="Submitted documents" rows={application.documents} columns={[{ field: 'name', headerName: 'Document', minWidth: 180, flex: 1 }, { field: 'filename', headerName: 'Filename / reference', minWidth: 240, flex: 2 }]} /></div>
      </Panel>
      <Link className={`${btn} mt-5`} href={role === 'vendor' ? `/vendor/tenders/${application.tenderId}` : `/tenders/${application.tenderId}`}>View tender</Link>
    </>}
  </Portal>;
}
