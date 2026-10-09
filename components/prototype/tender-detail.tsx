'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { analyze, money } from '@/lib/prototype';
import { DataTable } from '@/components/msflib/data-table';
import { Portal, Panel, Action, Heading } from './portal';
import { useData, btn } from './common';
export function TenderDetail({ role }: { role: 'buyer' | 'vendor' }) {
  const { db, update } = useData();
  const params = useParams();
  const id = String(params.id || params.tenderId);
  const t = db?.tenders.find((x) => x.id === id);
  const apps = db?.applications.filter((x) => x.tenderId === id) || [];
  if (!t) return <div className="p-10">Loading tender…</div>;
  return (
    <Portal role={role}>
      <Heading
        title={t.title}
        subtitle={`${t.id} · ${t.category} · ${t.type} · ${t.status}`}
        action={
          role === 'vendor' && t.status === 'open' ? (
            <Link className={btn} href={`/vendor/tenders/${id}/apply`}>
              Apply for tender →
            </Link>
          ) : undefined
        }
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Panel title="Tender overview">
            <p className="text-sm text-ink-soft">{t.description}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ['Maximum budget', money(t.budget)],
                ['Deadline', t.deadline],
                ['Location', t.location],
                ['Status', t.status],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-paper p-3">
                  <p className="text-xs text-ink-soft">{k}</p>
                  <b>{v}</b>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Items / deliverables">
            <DataTable
              title="Items / deliverables"
              rows={t.items.map((item, index) => ({
                ...item,
                id: `item-${index}`,
              }))}
              columns={[
                {
                  field: 'name',
                  headerName: 'Item / deliverable',
                  minWidth: 220,
                  flex: 2,
                },
                { field: 'quantity', headerName: 'Quantity', width: 110 },
                { field: 'unit', headerName: 'Unit', width: 110 },
              ]}
            />
          </Panel>
          <Panel title="Custom requirements">
            <DataTable
              title="Custom requirements"
              rows={t.requirements}
              columns={[
                {
                  field: 'label',
                  headerName: 'Requirement',
                  minWidth: 180,
                  flex: 1,
                },
                {
                  field: 'value',
                  headerName: 'Expected value / description',
                  minWidth: 240,
                  flex: 2,
                },
              ]}
            />
            {!t.requirements.length && (
              <p className="text-sm text-ink-soft">
                No additional specifications.
              </p>
            )}
          </Panel>
          {role === 'buyer' && (
            <Panel
              title={`Applications (${apps.length})`}
              subtitle="You decide when ProcureGuard analyzes each submission."
            >
              <DataTable
                title="Tender applications"
                rows={apps.map((a) => ({
                  ...a,
                  vendor:
                    db?.accounts.find((x) => x.id === a.vendorId)
                      ?.organization || 'Vendor',
                  assessment: a.analysis
                    ? `${a.analysis.score}/100 · ${a.analysis.risk} risk`
                    : 'Not analyzed',
                }))}
                columns={[
                  {
                    field: 'vendor',
                    headerName: 'Vendor',
                    minWidth: 180,
                    flex: 1,
                  },
                  {
                    field: 'price',
                    headerName: 'Bid',
                    width: 150,
                    renderCell: ({ row }) => money(row.price),
                  },
                  { field: 'status', headerName: 'Status', width: 130 },
                  {
                    field: 'assessment',
                    headerName: 'Assessment',
                    minWidth: 180,
                    flex: 1,
                  },
                  {
                    field: 'id',
                    headerName: 'Actions',
                    width: 330,
                    renderCell: ({ row }) => (
                      <div className="flex items-center gap-2">
                        <Link className={btn} href={`/applications/${row.id}`}>
                          View submission
                        </Link>
                        {!row.analysis && (
                          <Action
                            onClick={() =>
                              update((d) => {
                                const app = d.applications.find(
                                  (x) => x.id === row.id
                                );
                                if (app) app.analysis = analyze(app, t);
                              })
                            }
                          >
                            Analyze submission
                          </Action>
                        )}
                      </div>
                    ),
                  },
                ]}
              />
              {!apps.length && (
                <p className="py-5 text-sm text-ink-soft">
                  No applications yet. Published tenders are visible to all
                  vendors.
                </p>
              )}
              {apps.length > 0 && (
                <Link className={`${btn} mt-4`} href={`/tenders/${id}/compare`}>
                  Compare vendors →
                </Link>
              )}
            </Panel>
          )}
        </div>
        <Panel title="Required application documents">
          <DataTable
            title="Required documents"
            rows={t.documents.map((name, index) => ({
              id: `document-${index}`,
              name,
            }))}
            columns={[
              {
                field: 'name',
                headerName: 'Required document',
                minWidth: 230,
                flex: 1,
              },
            ]}
          />
        </Panel>
      </div>
    </Portal>
  );
}
