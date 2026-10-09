import { PaymentDetails } from '@/components/prototype/payment-details';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PaymentDetails id={id} />;
}
