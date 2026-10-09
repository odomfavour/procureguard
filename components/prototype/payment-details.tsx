'use client';
import { useAuth } from '@msflib/react-auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getPayment, type PaymentRecord } from '@/lib/api/payments';
import { verifyPayment } from '@/lib/api/procurement-analysis';
import { useState } from 'react';
import { useToast } from '@/components/ui/toast-provider';
import { PageState, isNotFoundError } from '@/components/ui/page-state';
import { Loading } from '@/components/ui/shared';
import { formatDate } from '@/utils/format-date';
import { Portal, Panel, Heading, Action } from './portal';

export function PaymentSummary({ payment }: { payment: PaymentRecord }) {
  return <dl className="mb-5 grid gap-4 break-words text-sm sm:grid-cols-2">
    {[
      ['Payment ID', String(payment.id)], ['Reference', payment.reference], ['Status', payment.status],
      ['Gateway', payment.gateway], ['Amount', String(payment.amount)], ['Email', payment.email],
      ['Description', payment.description || '—'], ['Created', formatDate(payment.created_at || '')],
      ['Updated', formatDate(payment.updated_at || '')],
    ].map(([label, value]) => <div key={label}><dt className="text-ink-soft">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}
  </dl>;
}
export function PaymentDetails({ id }: { id: string }) {
  const auth = useAuth();
  const client = useQueryClient();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const key = ['procureguard', 'payments', auth.me?.id, id];
  const query = useQuery({ queryKey: key, queryFn: () => getPayment(id), enabled: auth.status === 'authenticated' });
  const role = auth.me?.data?.account_type === 'vendor' || auth.me?.role === 'vendor' ? 'vendor' : 'buyer';
  async function verify() {
    if (busy || !query.data?.reference) return;
    setBusy(true);
    try {
      const payment = await verifyPayment(query.data.reference);
      client.setQueryData(key, payment);
      await client.invalidateQueries({ queryKey: ['procureguard', 'orders'] });
      toast(payment.status === 'verified' || payment.status === 'fulfilled' ? 'Payment verified.' : `Payment status: ${payment.status}`);
    } catch (error) { toast(error instanceof Error ? error.message : 'Verification failed.', 'error'); }
    finally { setBusy(false); }
  }
  return <Portal role={role}>
    <Heading title="Payment details" subtitle="Payment information returned by the backend." />
    {query.isPending ? <Loading /> : query.isError ? <PageState kind={isNotFoundError(query.error) ? 'not-found' : 'error'} title="Couldn’t load payment" onRetry={() => void query.refetch()} backHref={role === 'buyer' ? '/orders' : '/vendor/orders'} backLabel="Back to orders" /> : <Panel title={`Payment #${id}`}>
      <PaymentSummary payment={query.data} />
      <Action disabled={busy || !query.data.reference} onClick={() => void verify()}>{busy ? 'Verifying…' : 'Verify payment'}</Action>
    </Panel>}
  </Portal>;
}
