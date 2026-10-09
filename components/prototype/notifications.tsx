'use client';
import { session } from '@/lib/prototype';
import { DataTable } from '@/components/msflib/data-table';
import { Portal, Panel, Heading } from './portal';
import { useData } from './common';
export function Notifications({ role }: { role: 'buyer' | 'vendor' }) {
  const { db, update } = useData();
  const rows = (
    db?.notifications.filter((n) => n.accountId === session()) || []
  ).map((n) => ({ ...n, status: n.read ? 'Read' : 'Unread' }));
  return (
    <Portal role={role}>
      <Heading
        title="Notifications"
        subtitle="Tender applications, awards, escrow and delivery updates."
      />
      <Panel>
        <DataTable
          rows={rows}
          title="Notifications"
          columns={[
            {
              field: 'message',
              headerName: 'Message',
              minWidth: 360,
              flex: 2,
              renderCell: ({ row }) => (
                <span className={row.read ? 'text-ink-soft' : 'font-semibold'}>
                  {row.message}
                </span>
              ),
            },
            { field: 'status', headerName: 'Status', width: 110 },
            {
              field: 'id',
              headerName: 'Actions',
              width: 220,
              renderCell: ({ row }) => (
                <div className="flex items-center gap-4">
                  {!row.read && (
                    <button
                      className="text-sm text-brand"
                      onClick={() =>
                        update((d) => {
                          const n = d.notifications.find(
                            (x) => x.id === row.id
                          );
                          if (n) n.read = true;
                        })
                      }
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    className="text-sm text-risk-high"
                    aria-label={`Delete notification: ${row.message}`}
                    onClick={() =>
                      update((d) => {
                        d.notifications = d.notifications.filter(
                          (x) => x.id !== row.id
                        );
                      })
                    }
                  >
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
        />
        {!rows.length && (
          <p className="text-sm text-ink-soft">You are all caught up.</p>
        )}
      </Panel>
    </Portal>
  );
}
