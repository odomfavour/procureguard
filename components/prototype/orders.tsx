'use client';
import { useAuth } from '@msflib/react-auth';
import { LiveOrders } from './live-orders';
import { DataTable } from '@/components/msflib/data-table';
import { useState } from 'react';
import { session, notify, money } from '@/lib/prototype';
import { Portal, Panel, Action, Field, Heading } from './portal';
import { useData, btn } from './common';
export function Orders({ role }: { role: 'buyer' | 'vendor' }) {
  const auth = useAuth();
  const { db, update } = useData();
  const a = session();
  const [selected, setSelected] = useState<string | null>(null);
  const [tracking, setTracking] = useState('');
  const [carrier, setCarrier] = useState('');
  const orders =
    db?.orders.filter((o) => {
      const t = db.tenders.find((t) => t.id === o.tenderId);
      const app = db.applications.find((x) => x.id === o.applicationId);
      return role === 'buyer' ? t?.buyerId === a : app?.vendorId === a;
    }) || [];
  if (auth.status === 'authenticated') return <LiveOrders role={role} />;
  return (
    <Portal role={role}>
      <Heading
        title={role === 'buyer' ? 'Orders & escrow' : 'Fulfillment & payouts'}
        subtitle="A shared transaction timeline with buyer-confirmed escrow release."
      />
      <Panel title="Order register">
        <DataTable
          title="Orders"
          rows={orders.map((o) => {
            const app = db?.applications.find((x) => x.id === o.applicationId);
            return {
              ...o,
              title:
                db?.tenders.find((t) => t.id === o.tenderId)?.title || 'Tender',
              supplier:
                db?.accounts.find((v) => v.id === app?.vendorId)
                  ?.organization || 'Vendor',
              amount: app?.price || 0,
              statusLabel: o.status.replaceAll('_', ' '),
            };
          })}
          columns={[
            { field: 'title', headerName: 'Tender', minWidth: 220, flex: 2 },
            {
              field: 'supplier',
              headerName: 'Supplier',
              minWidth: 180,
              flex: 1,
            },
            {
              field: 'amount',
              headerName: 'Amount',
              width: 160,
              renderCell: ({ row }) => money(row.amount),
            },
            { field: 'statusLabel', headerName: 'Status', width: 180 },
            {
              field: 'id',
              headerName: 'Actions',
              width: 170,
              renderCell: ({ row }) => (
                <button
                  className={btn}
                  aria-expanded={selected === row.id}
                  onClick={() => {
                    setSelected(row.id);
                    setTracking(row.tracking || '');
                    setCarrier(row.carrier || '');
                  }}
                >
                  Manage order
                </button>
              ),
            },
          ]}
        />
        {orders.length > 0 && !selected && (
          <p className="mt-3 text-sm text-ink-soft">
            Choose Manage order to view shipment and escrow actions.
          </p>
        )}
      </Panel>
      <div className="mt-5 space-y-5">
        {orders
          .filter((o) => o.id === selected)
          .map((o) => {
            const t = db?.tenders.find((x) => x.id === o.tenderId);
            const app = db?.applications.find((x) => x.id === o.applicationId);
            const vendor = db?.accounts.find((x) => x.id === app?.vendorId);
            return (
              <Panel
                key={o.id}
                title={t?.title}
                subtitle={`${o.id} · ${o.status.replaceAll('_', ' ')} · ${money(app?.price || 0)}`}
              >
                <p className="mb-4 text-sm text-ink-soft">
                  Supplier: {vendor?.organization} · {t?.type} · Escrow is
                  simulated.
                </p>
                {o.tracking && (
                  <p className="mb-4 text-sm">
                    Shipping: {o.carrier} · Tracking: {o.tracking}
                  </p>
                )}
                {role === 'buyer' && o.status === 'awaiting_payment' && (
                  <Action
                    onClick={() =>
                      update((d) => {
                        const x = d.orders.find((x) => x.id === o.id)!;
                        x.status = 'funded';
                        notify(
                          d,
                          app!.vendorId,
                          `Escrow funded for ${t?.title}. You may now fulfill the order.`
                        );
                      })
                    }
                  >
                    Simulate payment into escrow
                  </Action>
                )}
                {role === 'vendor' && o.status === 'funded' && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      label="Carrier / fulfillment method"
                      value={carrier}
                      onChange={setCarrier}
                    />
                    <Field
                      label="Tracking number / evidence"
                      value={tracking}
                      onChange={setTracking}
                    />
                    <div className="sm:col-span-2">
                      <Action
                        disabled={!tracking || !carrier}
                        onClick={() =>
                          update((d) => {
                            const x = d.orders.find((x) => x.id === o.id)!;
                            x.status = 'shipped';
                            x.carrier = carrier;
                            x.tracking = tracking;
                            notify(
                              d,
                              t!.buyerId,
                              `${vendor?.organization} reported shipment / completion for ${t?.title}.`
                            );
                          })
                        }
                      >
                        Mark as shipped / completed
                      </Action>
                    </div>
                  </div>
                )}
                {role === 'buyer' && o.status === 'shipped' && (
                  <div className="flex flex-wrap gap-3">
                    <Action
                      onClick={() => {
                        if (
                          !confirm(
                            'Confirm goods received or services completed? This initiates escrow release.'
                          )
                        )
                          return;
                        update((d) => {
                          const x = d.orders.find((x) => x.id === o.id)!;
                          x.status = 'release_pending';
                          notify(
                            d,
                            app!.vendorId,
                            `Buyer confirmed receipt for ${t?.title}. Payout processing.`
                          );
                        });
                      }}
                    >
                      Confirm receipt & initiate release
                    </Action>
                    <button
                      className={btn}
                      onClick={() =>
                        update((d) => {
                          d.orders.find((x) => x.id === o.id)!.status =
                            'issue_reported';
                        })
                      }
                    >
                      Report delivery issue
                    </button>
                  </div>
                )}
                {role === 'buyer' && o.status === 'release_pending' && (
                  <Action
                    onClick={() =>
                      update((d) => {
                        const x = d.orders.find((x) => x.id === o.id)!;
                        x.status = 'completed';
                        d.tenders.find((x) => x.id === o.tenderId)!.status =
                          'completed';
                        notify(
                          d,
                          app!.vendorId,
                          `Payout confirmed for ${t?.title}.`
                        );
                        notify(
                          d,
                          t!.buyerId,
                          `Procurement completed: ${t?.title}.`
                        );
                      })
                    }
                  >
                    Simulate provider payout confirmation
                  </Action>
                )}
                {o.status === 'completed' && (
                  <p className="font-semibold text-risk-low">
                    ✓ Delivery confirmed and vendor payout completed.
                  </p>
                )}
                {o.status === 'issue_reported' && (
                  <p className="text-sm text-risk-high">
                    Delivery issue reported. Escrow remains held; no automatic
                    release.
                  </p>
                )}
                {o.status === 'funded' && role === 'buyer' && (
                  <p className="text-sm text-ink-soft">
                    Escrow funded. Waiting for vendor fulfillment.
                  </p>
                )}
                {o.status === 'release_pending' && role === 'vendor' && (
                  <p className="text-sm text-ink-soft">
                    Buyer confirmed receipt. Waiting for simulated provider
                    payout confirmation.
                  </p>
                )}
              </Panel>
            );
          })}
        {!orders.length && (
          <Panel>
            <p className="text-sm text-ink-soft">
              No orders yet. Award a tender to start the escrow workflow.
            </p>
          </Panel>
        )}
      </div>
    </Portal>
  );
}
