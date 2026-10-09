import { LiveApplicationDetail } from '@/components/prototype/live-applications';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LiveApplicationDetail id={id} role="vendor" />;
}
