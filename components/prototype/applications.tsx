'use client';
import Link from 'next/link';
import { Portal, Panel, Heading } from './portal';
import { useData, btn } from './common';
import { session, money } from '@/lib/prototype';
import { DataTable } from '@/components/msflib/data-table';
export function Applications() {
  const { db } = useData();
  const a = session();
  const rows = (db?.applications.filter((x) => x.vendorId === a) || []).map(
    (x) => ({
      ...x,
      title: db?.tenders.find((t) => t.id === x.tenderId)?.title || 'Tender',
    })
  );
  return (
    <Portal role="vendor">
      <Heading
        title="My applications"
        subtitle="Track submitted bids and procurement decisions."
      />
      <Panel>
        <DataTable
          rows={rows}
          title="My applications"
          columns={[
            { field: 'title', headerName: 'Tender', minWidth: 220, flex: 1 },
            {
              field: 'price',
              headerName: 'Bid price',
              width: 160,
              renderCell: ({ row }) => money(row.price),
            },
            { field: 'status', headerName: 'Status', width: 140 },
            {
              field: 'tenderId',
              headerName: 'Details',
              width: 170,
              renderCell: ({ row }) => (
                <Link className={btn} href={`/vendor/tenders/${row.tenderId}`}>
                  View tender
                </Link>
              ),
            },
          ]}
        />
        {!rows.length && (
          <p className="text-sm text-ink-soft">
            You have not applied for a tender yet.
          </p>
        )}
      </Panel>
    </Portal>
  );
}
