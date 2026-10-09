'use client';
import Link from 'next/link';
import { PaymentSummary } from './payment-details';
import { useAuth } from '@msflib/react-auth';
import { useQuery } from '@tanstack/react-query';
import { verifyPayment } from '@/lib/api/procurement-analysis';
import { Loading } from '@/components/ui/shared';
import { PageState } from '@/components/ui/page-state';
import { Portal, Panel, Heading } from './portal';
import { btn } from './common';

export function PaymentCallback({ reference, applicationId }: { reference: string; applicationId: string }) {
  const auth = useAuth();
  const query = useQuery({
    queryKey: ['procureguard', 'payment-verification', auth.me?.id, reference],
    queryFn: () => verifyPayment(reference),
    enabled: !!reference && auth.status === 'authenticated', retry: false,
  });
  const verified = query.data?.status === 'verified' || query.data?.status === 'fulfilled';
  return <Portal role="buyer">
    <Heading title="Escrow payment" subtitle="Checking the payment status with the backend." />
    {!reference ? <PageState title="Payment reference missing" description="Return to your application to check its status." backHref="/tenders" backLabel="Back to tenders" /> : query.isPending ? <Loading /> : query.isError ? <PageState title="Couldn’t verify payment" description="Payment has not been confirmed. Retry verification before starting another payment." onRetry={() => void query.refetch()} backHref="/tenders" backLabel="Back to tenders" /> : <Panel title={verified ? 'Payment verified' : query.data?.status === 'failed' ? 'Payment failed' : 'Payment awaiting verification'}>
      <p className="mb-4 text-sm text-ink-soft">{verified ? 'The backend has verified your payment. Shipment eligibility follows the backend escrow status.' : 'Escrow funding has not been confirmed. Check again before taking further action.'}</p>
      {query.data && <PaymentSummary payment={query.data} />}
      {query.data?.id != null && <Link className={`${btn} mr-3`} href={`/payments/${query.data.id}`}>Payment details</Link>}
      {!verified && <button className={`${btn} mr-3`} disabled={query.isFetching} onClick={() => void query.refetch()}>Check again</button>}
      <Link className={btn} href={/^\d+$/.test(applicationId) ? `/applications/${applicationId}` : '/tenders'}>Back to application</Link>
    </Panel>}
  </Portal>;
}
