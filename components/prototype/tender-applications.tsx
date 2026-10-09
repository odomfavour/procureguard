'use client';
import Link from 'next/link';
import { useAuth } from '@msflib/react-auth';
import { useQuery } from '@tanstack/react-query';
import { listTenderApplications } from '@/lib/api/applications';
import { DataTable } from '@/components/msflib/data-table';
import { Loading } from '@/components/ui/shared';
import { PageState } from '@/components/ui/page-state';
import { money } from '@/lib/prototype';
import { Panel } from './portal';
export function TenderApplications({ id }: { id: string }) {
  const auth = useAuth();
  const query = useQuery({ queryKey: ['procureguard', 'applications', auth.me?.id, 'tender', id], queryFn: () => listTenderApplications(id) });
  return <Panel title="Vendor applications">
    {query.isPending ? <Loading /> : query.isError ? <PageState title="Couldn’t load applicants" onRetry={() => void query.refetch()} backHref="/tenders" backLabel="Back to tenders" /> : <>
      <DataTable title="Vendor applications" rows={query.data} columns={[
        { field: 'vendorName', headerName: 'Vendor', minWidth: 200, flex: 1 },
        { field: 'price', headerName: 'Proposed total', width: 180, renderCell: ({ row }) => row.price === null ? '—' : money(row.price) },
        { field: 'deliveryTimeline', headerName: 'Delivery timeline', width: 180 },
        { field: 'status', headerName: 'Status', width: 140 },
        { field: 'id', headerName: 'Review', width: 180, renderCell: ({ row }) => <Link className="font-semibold text-brand hover:underline" href={`/applications/${row.id}`}>Review application</Link> },
      ]} />
      {!query.data.length && <p className="py-6 text-center text-sm text-ink-soft">No applications yet.</p>}
    </>}
  </Panel>;
}
