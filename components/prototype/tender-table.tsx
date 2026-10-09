'use client';
import Link from 'next/link';
import { DataTable, type Column } from '@/components/msflib/data-table';
import { money, type Tender, type Role } from '@/lib/prototype';
export function TenderTable({
  tenders,
  role,
  title,
}: {
  tenders: Tender[];
  role: Role;
  title: string;
}) {
  const columns: Column<Tender>[] = [
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
    { field: 'category', headerName: 'Category', minWidth: 160, flex: 1 },
    { field: 'type', headerName: 'Type', width: 110 },
    { field: 'location', headerName: 'Location', minWidth: 130, flex: 1 },
    {
      field: 'budget',
      headerName: 'Budget',
      width: 170,
      renderCell: ({ row }) => money(row.budget),
    },
    { field: 'deadline', headerName: 'Deadline', width: 140 },
    { field: 'status', headerName: 'Status', width: 130 },
  ];
  return <DataTable rows={tenders} columns={columns} title={title} />;
}
