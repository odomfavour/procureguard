'use client';
import { DataTable } from '@/components/msflib/data-table';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@msflib/react-auth';
import { useNotification } from '@msflib/react-notification';
import { useActiveWorkspace } from '@msflib/react-shared';
import { useQueryClient } from '@tanstack/react-query';
import { setActiveWorkspace } from '@msflib/core';
import {
  PageHeader,
  ErrorState,
  Section,
  Badge,
  Empty,
} from '@/components/ui/shared';
import WorkspacePanel from './WorkspacePanel';
import ProfilePanel from './ProfilePanel';
import DocumentsPanel from './DocumentsPanel';
import AiPanel from './AiPanel';
export default function LivePortal() {
  const auth = useAuth();
  const notifications = useNotification();
  const active = useActiveWorkspace();
  const client = useQueryClient();
  const [tab, setTab] = useState('Organization');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function execute(action: () => Promise<unknown>) {
    setError('');
    setMessage('');
    setBusy(true);
    try {
      await action();
      setMessage('Request completed.');
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Request failed. Check your API configuration.'
      );
    } finally {
      setBusy(false);
    }
  }
  const run = (action: () => Promise<unknown>) => {
    void execute(action);
  };
  return (
    <main className="integration mx-auto max-w-6xl p-5 sm:p-8">
      <div className="topbar">
        <Link className="brand" href="/">
          ◈ ProcureGuard
        </Link>
        <button
          disabled={busy}
          onClick={() =>
            run(async () => {
              await auth.logout();
              await client.cancelQueries();
              client.clear();
              setActiveWorkspace(null);
            })
          }
        >
          Log out
        </button>
      </div>
      <PageHeader
        title="Your procurement workspace"
        description={`Live MSFLib account: ${auth.me?.email || ''}`}
      />
      <div className="notice">
        Live API mode · {active || 'No organization selected'} · Procurement
        persistence and payment services are not connected.{' '}
        <Link href="/demo">Open full workflow demo →</Link>
      </div>
      <nav className="tabs" aria-label="Live modules">
        {['Organization', 'Profile', 'Documents', 'AI', 'Notifications'].map(
          (t) => (
            <button
              key={t}
              aria-current={tab === t ? 'page' : undefined}
              onClick={() => {
                setTab(t);
                setError('');
                setMessage('');
              }}
            >
              {t}
            </button>
          )
        )}
      </nav>
      <ErrorState message={error} />
      {message && <p role="status">{message}</p>}
      {busy && <p role="status">Working…</p>}
      {tab === 'Organization' && <WorkspacePanel run={run} />}
      {tab !== 'Organization' &&
      !active &&
      process.env.NEXT_PUBLIC_WORKSPACE_MODE !== 'single' ? (
        <Empty>Select an organization first.</Empty>
      ) : (
        <div key={active || 'single'}>
          {tab === 'Profile' && <ProfilePanel run={run} />}
          {tab === 'Documents' && <DocumentsPanel run={run} />}
          {tab === 'AI' && <AiPanel run={run} />}
          {tab === 'Notifications' && (
            <Section title="Notifications">
              <button
                onClick={() =>
                  run(
                    () =>
                      new Promise((resolve, reject) =>
                        notifications.toggleAllStatus(true, {
                          onSuccess: resolve,
                          onError: reject,
                        })
                      )
                  )
                }
              >
                Mark all read
              </button>
              {!(notifications.notifications || []).length && (
                <Empty>
                  No notifications returned. Backend connectivity has not been
                  verified.
                </Empty>
              )}
              <DataTable
                title="Notifications"
                rows={(notifications.notifications || []).map((n) => ({
                  id: String(n.notification_id),
                  notificationId: n.notification_id,
                  title: n.notification.title,
                  message: n.notification.message,
                  status: n.is_read ? 'Read' : 'Unread',
                  isRead: n.is_read,
                }))}
                columns={[
                  {
                    field: 'title',
                    headerName: 'Title',
                    minWidth: 180,
                    flex: 1,
                  },
                  {
                    field: 'message',
                    headerName: 'Message',
                    minWidth: 320,
                    flex: 2,
                  },
                  {
                    field: 'status',
                    headerName: 'Status',
                    width: 110,
                    renderCell: ({ row }) => <Badge>{row.status}</Badge>,
                  },
                  {
                    field: 'id',
                    headerName: 'Actions',
                    width: 240,
                    renderCell: ({ row }) => (
                      <div className="flex items-center gap-3">
                        {!row.isRead && (
                          <button
                            disabled={busy}
                            onClick={() =>
                              run(
                                () =>
                                  new Promise((resolve, reject) =>
                                    notifications.toggleStatus(
                                      { id: row.notificationId, status: true },
                                      { onSuccess: resolve, onError: reject }
                                    )
                                  )
                              )
                            }
                          >
                            Mark read
                          </button>
                        )}
                        <button
                          disabled={busy}
                          onClick={() =>
                            run(
                              () =>
                                new Promise((resolve, reject) =>
                                  notifications.removeNotification(
                                    row.notificationId,
                                    { onSuccess: resolve, onError: reject }
                                  )
                                )
                            )
                          }
                        >
                          Delete
                        </button>
                      </div>
                    ),
                  },
                ]}
              />
            </Section>
          )}
        </div>
      )}
    </main>
  );
}
