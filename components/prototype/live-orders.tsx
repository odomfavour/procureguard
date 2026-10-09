'use client';
import { useRef, useState } from 'react';
import { useAuth } from '@msflib/react-auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button } from '@mui/material';
import { DataTable } from '@/components/msflib/data-table';
import { PageState, isNotFoundError } from '@/components/ui/page-state';
import { Loading } from '@/components/ui/shared';
import { useToast } from '@/components/ui/toast-provider';
import { getOrder, listOrders, receiveOrder, shipOrder } from '@/lib/api/orders';
import { formatDate } from '@/utils/format-date';
import { money } from '@/lib/prototype';
import { Portal, Panel, Heading, Field, Action } from './portal';

export function LiveOrders({ role }: { role: 'buyer' | 'vendor' }) {
  const auth = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const query = useQuery({ queryKey: ['procureguard', 'orders', auth.me?.id], queryFn: listOrders });
  return <Portal role={role}>
    <Heading title={role === 'buyer' ? 'Orders & escrow' : 'Fulfillment & payouts'} subtitle="Track your orders, shipments and receipt confirmations." />
    <Panel title="Order register">
      {query.isPending ? <Loading /> : query.isError ? <PageState title="Couldn’t load orders" onRetry={() => void query.refetch()} backHref={role === 'buyer' ? '/dashboard' : '/vendor/dashboard'} backLabel="Back to dashboard" /> : <>
        <DataTable title="Orders" rows={query.data} columns={[
          { field: 'title', headerName: 'Tender / order', minWidth: 220, flex: 1 },
          { field: role === 'buyer' ? 'vendor' : 'buyer', headerName: role === 'buyer' ? 'Vendor' : 'Buyer', minWidth: 180, flex: 1 },
          { field: 'amount', headerName: 'Amount', width: 160, renderCell: ({ row }) => row.amount === null ? '—' : money(row.amount) },
          { field: 'status', headerName: 'Status', width: 180, renderCell: ({ row }) => row.status.replaceAll('_', ' ') },
          { field: 'id', headerName: 'Details', width: 160, renderCell: ({ row }) => <button className="font-semibold text-brand hover:underline" onClick={() => setSelected(row.id)}>Manage order</button> },
        ]} />
        {!query.data.length && <p className="py-8 text-center text-ink-soft">No orders yet.</p>}
      </>}
    </Panel>
    {selected && <div className="mt-5"><OrderDetail key={selected} id={selected} role={role} /></div>}
  </Portal>;
}

function OrderDetail({ id, role }: { id: string; role: 'buyer' | 'vendor' }) {
  const auth = useAuth();
  const client = useQueryClient();
  const toast = useToast();
  const [note, setNote] = useState('');
  const [tracking, setTracking] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const query = useQuery({ queryKey: ['procureguard', 'orders', auth.me?.id, id], queryFn: () => getOrder(id) });
  const order = query.data;
  const shipped = !!order && ['shipped', 'in_transit', 'delivered'].includes(order.status.toLowerCase());
  const funded = !!order && (['funded', 'paid', 'escrow_funded', 'awaiting_shipment'].includes(order.status.toLowerCase()) || order.escrowStatus === 'funded');
  const canShip = funded && !shipped && !['received', 'completed', 'cancelled'].includes(order?.status.toLowerCase() || '');
  const allowed = role === 'vendor' ? canShip : shipped;
  async function submit() {
    if (lock.current || !allowed) return;
    lock.current = true; setBusy(true); setError('');
    try {
      if (role === 'vendor') await shipOrder(id, note.trim(), tracking.trim());
      else await receiveOrder(id, note.trim());
      setConfirm(false); setNote(''); setTracking('');
      toast(role === 'vendor' ? 'Order marked as shipped.' : 'Receipt confirmed.');
      await client.invalidateQueries({ queryKey: ['procureguard', 'orders'] });
      await client.invalidateQueries({ queryKey: ['procureguard', 'applications'] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not update order.';
      setError(message); toast(message, 'error');
    } finally { lock.current = false; setBusy(false); }
  }
  return <Panel title={`Order #${id}`}>
    {query.isPending ? <Loading /> : query.isError ? <PageState kind={isNotFoundError(query.error) ? 'not-found' : 'error'} title="Couldn’t load this order" onRetry={() => void query.refetch()} backHref={role === 'buyer' ? '/orders' : '/vendor/orders'} backLabel="Back to orders" /> : order && <>
      <dl className="mb-5 grid gap-4 text-sm sm:grid-cols-2">
        {[
          ['Tender', order.title], ['Status', order.status.replaceAll('_', ' ')],
          ['Amount', order.amount === null ? '—' : money(order.amount)], ['Escrow status', order.escrowStatus || 'Not provided'],
          ['Tracking reference', order.tracking || 'Not provided'], ['Created', formatDate(order.createdAt)],
        ].map(([label, value]) => <div key={label}><dt className="text-ink-soft">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}
      </dl>
      {order.note && <p className="mb-5 whitespace-pre-wrap text-sm">{order.note}</p>}
      {allowed ? <div className="max-w-xl space-y-4">
        {role === 'vendor' && <Field label="Tracking reference" value={tracking} onChange={setTracking} />}
        <Field label="Note (optional)" value={note} onChange={setNote} />
        <Action disabled={busy || (role === 'vendor' && !tracking.trim())} onClick={() => setConfirm(true)}>{busy ? 'Saving…' : role === 'vendor' ? 'Mark shipped' : 'Confirm receipt'}</Action>
      </div> : <p className="text-sm text-ink-soft">{role === 'vendor' ? 'Shipping becomes available when escrow is funded and the order is ready to ship.' : 'Receipt confirmation becomes available after the vendor marks the order shipped.'}</p>}
      {error && <p role="alert" className="mt-4 text-sm text-risk-high">{error}</p>}
    </>}
    <Dialog open={confirm} onClose={() => { if (!busy) setConfirm(false); }} aria-labelledby="order-action-title">
      <DialogTitle id="order-action-title">{role === 'vendor' ? 'Mark order shipped?' : 'Confirm you received this order?'}</DialogTitle>
      <DialogContent>{role === 'vendor' ? `Confirm shipment with tracking reference ${tracking}.` : 'Confirm only after receiving and checking the delivery. This updates the order and may advance the escrow release process.'}</DialogContent>
      <DialogActions><Button disabled={busy} onClick={() => setConfirm(false)}>Cancel</Button><Button variant="contained" disabled={busy} onClick={() => void submit()}>{busy ? 'Saving…' : 'Confirm'}</Button></DialogActions>
    </Dialog>
  </Panel>;
}
