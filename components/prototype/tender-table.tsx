'use client';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { DataTable, type Column } from '@/components/msflib/data-table';
import { money, type Role } from '@/lib/prototype';
import type { TenderSummary } from '@/lib/api/tenders';

const statusStyles: Record<string, string> = {
  open: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  draft: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  closed: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  awarded: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  cancelled: 'bg-red-50 text-red-700 ring-red-600/20',
};

function StatusBadge({ status }: { status: string }) {
  const style =
    statusStyles[status.toLowerCase()] ??
    'bg-slate-100 text-slate-600 ring-slate-500/20';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${style}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function TenderTable({
  tenders,
  role,
  title,
}: {
  tenders: TenderSummary[];
  role: Role;
  title: string;
}) {
  const columns: Column<TenderSummary>[] = [
    {
      field: 'title',
      headerName: 'Tender',
      minWidth: 240,
      flex: 2,
      renderCell: ({ row }) => (
        <Link
          className="font-semibold text-brand hover:underline"
          href={
            role === 'buyer'
              ? `/tenders/${row.id}`
              : `/vendor/tenders/${row.id}`
          }
        >
          {row.title}
        </Link>
      ),
    },
    {
      field: 'category',
      headerName: 'Category',
      minWidth: 160,
      flex: 1,
      renderCell: ({ row }) => (
        <span className="rounded-md bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
          {row.category}
        </span>
      ),
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 110,
      renderCell: ({ row }) => (
        <span className="capitalize text-ink-soft">{row.type}</span>
      ),
    },
    {
      field: 'location',
      headerName: 'Location',
      minWidth: 130,
      flex: 1,
      renderCell: ({ row }) => (
        <span className="flex items-center gap-1 text-ink-soft">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {row.location}
        </span>
      ),
    },
    {
      field: 'budget',
      headerName: 'Budget',
      width: 170,
      renderCell: ({ row }) => (
        <span className="font-semibold tabular-nums">{money(row.budget)}</span>
      ),
    },
    { field: 'deadline', headerName: 'Deadline', width: 140 },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: ({ row }) => <StatusBadge status={String(row.status)} />,
    },
  ];
  return <DataTable rows={tenders} columns={columns} title={title} />;
}
