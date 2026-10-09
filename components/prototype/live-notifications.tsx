'use client';
import { useState } from 'react';
import { useAccountNotifications } from '@/components/ui/notification-bell';
import { useAuth } from '@msflib/react-auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { getNotification, markNotification, markAllNotifications, deleteNotification } from '@/lib/api/notifications';
import { DataTable } from '@/components/msflib/data-table';
import { Loading } from '@/components/ui/shared';
import { PageState } from '@/components/ui/page-state';
import { useToast } from '@/components/ui/toast-provider';
import { formatDate } from '@/utils/format-date';
import { Portal, Panel, Heading, Action } from './portal';

export function LiveNotifications({ role }: { role: 'buyer' | 'vendor' }) {
  const auth = useAuth();
  const client = useQueryClient();
  const toast = useToast();
  const query = useAccountNotifications();
  const [selected, setSelected] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const detail = useQuery({ queryKey: ['procureguard', 'notification-detail', auth.me?.id, selected], queryFn: () => getNotification(selected!), enabled: selected !== null });
  async function run(action: () => Promise<unknown>, message: string) {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      setDeleting(null);
      await client.invalidateQueries({ queryKey: ['procureguard', 'notifications'] });
      await client.invalidateQueries({ queryKey: ['procureguard', 'notification-detail'] });
      toast(message);
    } catch (error) { toast(error instanceof Error ? error.message : 'Could not update notifications.', 'error'); }
    finally { setBusy(false); }
  }
  return <Portal role={role}>
    <Heading title="Notifications" subtitle="Tender applications, awards, escrow and delivery updates." />
    <Panel>
      {query.isPending ? <Loading /> : query.isError ? <PageState title="Couldn’t load notifications" onRetry={() => void query.refetch()} backHref={role === 'buyer' ? '/dashboard' : '/vendor/dashboard'} backLabel="Back to dashboard" /> : <>
        <div className="mb-4 flex flex-wrap gap-3"><Action disabled={busy || !query.data.some((row) => !row.read)} onClick={() => void run(() => markAllNotifications(true), 'All notifications marked read.')}>Mark all read</Action><button className="text-sm font-semibold text-brand disabled:opacity-40" disabled={busy || !query.data.some((row) => row.read)} onClick={() => void run(() => markAllNotifications(false), 'All notifications marked unread.')}>Mark all unread</button></div>
        <DataTable title="Notifications" rows={query.data} columns={[
          { field: 'title', headerName: 'Notification', minWidth: 220, flex: 1, renderCell: ({ row }) => <button className={`text-left text-brand hover:underline ${row.read ? '' : 'font-semibold'}`} onClick={() => setSelected(row.id)}>{row.title || 'View notification'}</button> },
          { field: 'message', headerName: 'Message', minWidth: 300, flex: 2 },
          { field: 'createdAt', headerName: 'Date', width: 140, renderCell: ({ row }) => formatDate(row.createdAt) },
          { field: 'read', headerName: 'Status', width: 100, renderCell: ({ row }) => row.read ? 'Read' : 'Unread' },
          { field: 'id', headerName: 'Actions', width: 240, renderCell: ({ row }) => <div className="flex gap-4"><button disabled={busy} className="font-semibold text-brand" onClick={() => void run(() => markNotification(row.id, !row.read), `Notification marked ${row.read ? 'unread' : 'read'}.`)}>Mark {row.read ? 'unread' : 'read'}</button><button disabled={busy} className="text-risk-high" onClick={() => setDeleting(row.id)}>Delete</button></div> },
        ]} />
        {!query.data.length && <p className="py-8 text-center text-ink-soft">You are all caught up.</p>}
      </>}
    </Panel>
    <Dialog open={selected !== null} onClose={() => setSelected(null)} fullWidth maxWidth="sm" aria-labelledby="notification-title">
      <DialogTitle id="notification-title">{detail.data?.title || 'Notification'}</DialogTitle>
      <DialogContent>{detail.isPending ? <Loading /> : detail.isError ? <p role="alert">Could not load notification. <button className="text-brand underline" onClick={() => void detail.refetch()}>Retry</button></p> : <><p className="whitespace-pre-wrap text-sm">{detail.data?.message}</p><p className="mt-4 text-xs text-ink-soft">{formatDate(detail.data?.createdAt || '')} · {detail.data?.type}</p></>}</DialogContent>
      <DialogActions>{detail.data && <Button disabled={busy} onClick={() => void run(() => markNotification(detail.data!.id, !detail.data!.read), 'Notification updated.')}>Mark {detail.data.read ? 'unread' : 'read'}</Button>}<Button onClick={() => setSelected(null)}>Close</Button></DialogActions>
    </Dialog>
    <Dialog open={deleting !== null} onClose={() => { if (!busy) setDeleting(null); }} aria-labelledby="delete-notification-title"><DialogTitle id="delete-notification-title">Delete notification?</DialogTitle><DialogContent>This removes the notification from your account.</DialogContent><DialogActions><Button disabled={busy} onClick={() => setDeleting(null)}>Cancel</Button><Button color="error" disabled={busy} onClick={() => void run(() => deleteNotification(deleting!), 'Notification deleted.')}>{busy ? 'Deleting…' : 'Delete'}</Button></DialogActions></Dialog>
  </Portal>;
}
