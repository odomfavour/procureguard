'use client';
import { PageState, isNotFoundError } from '@/components/ui/page-state';
import Link from 'next/link';
import { formatDate } from '@/utils/format-date';
import { ApplicationActions } from './application-actions';
import { DocumentPreview, type PreviewDocument } from '@/components/ui/document-preview';
import { useState } from 'react';
import { useAuth } from '@msflib/react-auth';
import { useQuery } from '@tanstack/react-query';
import { getApplication, listAllApplications } from '@/lib/api/applications';
import { DataTable } from '@/components/msflib/data-table';
import { Loading } from '@/components/ui/shared';
import { money } from '@/lib/prototype';
import { Portal, Panel, Heading } from './portal';
import { btn } from './common';

export function LiveApplications() {
  const auth = useAuth();
  const [status, setStatus] = useState('');
  const [tenderId, setTenderId] = useState('');
  const query = useQuery({
    queryKey: ['procureguard', 'applications', auth.me?.id, status, tenderId],
    queryFn: () => listAllApplications({ status: status || undefined, tenderId: tenderId || undefined }),
  });
  const rows = query.data?.applications || [];
  return <Portal role="vendor">
    <Heading title="My applications" subtitle="Track submitted bids and procurement decisions." />
    <Panel>
      <div className="mb-4 flex flex-wrap gap-4">
        <label className="text-sm font-medium">Status<input className="ml-2 rounded-lg border border-line px-3 py-2" placeholder="All statuses" value={status} onChange={(event) => { setStatus(event.target.value); }} /></label>
        <label className="text-sm font-medium">Tender ID<input className="ml-2 rounded-lg border border-line px-3 py-2" type="number" min="1" placeholder="All tenders" value={tenderId} onChange={(event) => { setTenderId(event.target.value); }} /></label>
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
      </>}
    </Panel>
  </Portal>;
}

export function LiveApplicationDetail({ id, role }: { id: string; role: 'buyer' | 'vendor' }) {
  const [preview, setPreview] = useState<PreviewDocument | null>(null);
  const auth = useAuth();
  const query = useQuery({ queryKey: ['procureguard', 'applications', auth.me?.id, 'detail', id], queryFn: () => getApplication(id), enabled: auth.status === 'authenticated' });
  const application = query.data;
  return <Portal role={role}>
    {query.isPending ? <Loading /> : query.isError ? <PageState kind={isNotFoundError(query.error) ? "not-found" : "error"} title={isNotFoundError(query.error) ? "Application not found" : "Couldn’t load this application"} onRetry={isNotFoundError(query.error) ? undefined : () => void query.refetch()} backHref={role === "vendor" ? "/vendor/applications" : "/tenders"} backLabel={role === "vendor" ? "Back to applications" : "Back to tenders"} /> : application && <>
      <Heading title={application.title} subtitle={`Application #${application.id} · ${application.status}`} />
      <Panel title="Tender & vendor details">
        <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['Vendor', application.vendorName || '—'], ['Category', application.category || '—'],
            ['Procurement type', application.procurementType || '—'], ['Maximum budget', application.maximumBudget === null ? '—' : money(application.maximumBudget)],
            ['Submission deadline', formatDate(application.deadline)], ['Delivery location', application.location || '—'],
            ['Submitted', formatDate(application.submittedAt)],
          ].map(([label, value]) => <div key={label}><dt className="text-ink-soft">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}
        </dl>
      </Panel>
      <div className="h-5" />
      <Panel title="Submission">
        <div className="mb-5 flex flex-wrap gap-6 text-sm"><p>Proposed price: <strong>{application.price === null ? '—' : money(application.price)}</strong></p><p>Delivery timeline: <strong>{application.deliveryTimeline || (application.deliveryDays === null ? '—' : `${application.deliveryDays} days`)}</strong></p></div>
        {application.proposal && <p className="mb-5 whitespace-pre-wrap text-sm">{application.proposal}</p>}
        {application.additionalNotes && <p className="mb-5 whitespace-pre-wrap text-sm text-ink-soft">{application.additionalNotes}</p>}
        <DataTable title="Item quotes" rows={application.itemQuotes} columns={[
          { field: 'item', headerName: 'Item', minWidth: 180, flex: 1 },
          { field: 'quantity', headerName: 'Quantity', width: 110 },
          { field: 'unit', headerName: 'Unit', width: 110 },
          { field: 'unitPrice', headerName: 'Unit price', width: 160, renderCell: ({ row }) => row.unitPrice === null ? '—' : money(row.unitPrice) },
          { field: 'totalPrice', headerName: 'Line total', width: 160, renderCell: ({ row }) => row.totalPrice === null ? '—' : money(row.totalPrice) },
        ]} />
        <div className="mt-5"><DataTable title="Requirement responses" rows={application.requirementResponses} columns={[
          { field: 'requirement', headerName: 'Requirement', minWidth: 180, flex: 1 },
          { field: 'requiredValue', headerName: 'Required value', minWidth: 180, flex: 1 },
          { field: 'response', headerName: 'Vendor response', minWidth: 200, flex: 1 },
        ]} /></div>
        <div className="mt-5"><DataTable title="Submitted documents" rows={application.documents} columns={[
          { field: 'name', headerName: 'Document', minWidth: 180, flex: 1 },
          { field: 'format', headerName: 'Format', width: 100 },
          { field: 'sizeBytes', headerName: 'Size', width: 120, renderCell: ({ row }) => row.sizeBytes === null ? '—' : `${(row.sizeBytes / 1024).toFixed(1)} KB` },
          { field: 'filename', headerName: 'File', minWidth: 180, flex: 1, renderCell: ({ row }) => row.url ? <button type="button" onClick={() => setPreview(row)} className="font-semibold text-brand hover:underline" aria-label={`Preview ${row.name}`}>Preview document</button> : row.filename },
        ]} /></div>
      </Panel>
      {role === 'buyer' && <ApplicationActions application={application} />}
      <Link className={`${btn} mt-5`} href={role === 'vendor' ? `/vendor/tenders/${application.tenderId}` : `/tenders/${application.tenderId}`}>View tender</Link>
      <DocumentPreview document={preview} onClose={() => setPreview(null)} />
    </>}
  </Portal>;
}
