'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Portal, Panel, Heading, Action } from './portal';
import { useData } from './common';
import { uid, notify, money } from '@/lib/prototype';
import { DataTable, type Column } from '@/components/msflib/data-table';
import { Confirm, Loading } from '@/components/ui/shared';
export function Compare() {
  const params = useParams();
  const id = String(params.id || params.tenderId);
  const router = useRouter();
  const { db, update } = useData();
  const [chosen, setChosen] = useState<string | null>(null);
  const t = db?.tenders.find((x) => x.id === id);
  const apps = db?.applications.filter((x) => x.tenderId === id) || [];
  if (!t) return <Loading />;
  const rows = apps.map((a) => ({
    ...a,
    vendor:
      db?.accounts.find((x) => x.id === a.vendorId)?.organization || 'Vendor',
    compliance: a.analysis?.compliance,
    score: a.analysis?.score,
    risk: a.analysis?.risk || 'Not analyzed',
  }));
  type Row = (typeof rows)[number];
  const columns: Column<Row>[] = [
    { field: 'vendor', headerName: 'Vendor', minWidth: 180, flex: 1 },
    {
      field: 'price',
      headerName: 'Bid price',
      width: 160,
      renderCell: ({ row }) => money(row.price),
    },
    {
      field: 'compliance',
      headerName: 'Compliance',
      width: 130,
      renderCell: ({ row }) =>
        row.analysis ? `${row.compliance}%` : 'Not analyzed',
    },
    {
      field: 'score',
      headerName: 'AI score',
      width: 110,
      renderCell: ({ row }) => (row.analysis ? `${row.score}/100` : '—'),
    },
    { field: 'risk', headerName: 'Risk', width: 110 },
    {
      field: 'status',
      headerName: 'Decision',
      width: 170,
      renderCell: ({ row }) =>
        t.winnerId === row.id ? (
          <b className="text-risk-low">Selected</b>
        ) : (
          <Action
            disabled={!!t.winnerId || !row.analysis}
            onClick={() => setChosen(row.id)}
          >
            Select vendor
          </Action>
        ),
    },
  ];
  return (
    <Portal role="buyer">
      <Heading
        title="Compare vendors"
        subtitle={`Select the winning application for ${t.title}. AI is advisory.`}
      />
      <Panel>
        <DataTable rows={rows} columns={columns} title="Vendor comparison" />
        {!apps.length && (
          <p className="p-4 text-sm text-ink-soft">
            No applications received yet.
          </p>
        )}
      </Panel>
      <Confirm
        open={!!chosen}
        title="Award this tender?"
        onClose={() => setChosen(null)}
        onConfirm={() => {
          if (!chosen) return;
          update((d) => {
            const tender = d.tenders.find((x) => x.id === id);
            const app = d.applications.find(
              (x) => x.id === chosen && x.tenderId === id
            );
            if (!tender || !app?.analysis || tender.winnerId) return;
            tender.winnerId = app.id;
            tender.status = 'awarded';
            d.applications
              .filter((x) => x.tenderId === id)
              .forEach(
                (x) =>
                  (x.status = x.id === app.id ? 'selected' : 'not_selected')
              );
            d.orders.push({
              id: uid(),
              tenderId: id,
              applicationId: app.id,
              status: 'awaiting_payment',
            });
            notify(
              d,
              app.vendorId,
              `You won the tender: ${t.title}. Awaiting escrow funding.`
            );
          });
          setChosen(null);
          router.push('/orders');
        }}
      >
        Award {t.title} to {rows.find((a) => a.id === chosen)?.vendor}? The
        order and escrow are simulated.
      </Confirm>
    </Portal>
  );
}
