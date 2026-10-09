import { PaymentCallback } from '@/components/prototype/payment-callback';
export default async function Page({ searchParams }: { searchParams: Promise<{ reference?: string; trxref?: string; application?: string }> }) {
  const params = await searchParams;
  return <PaymentCallback reference={params.reference || params.trxref || ''} applicationId={params.application || ''} />;
}
