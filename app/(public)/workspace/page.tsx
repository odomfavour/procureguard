'use client';
import { useAuth } from '@msflib/react-auth';
import Link from 'next/link';
import LivePortal from '@/components/integration/LivePortal';
import { Loading } from '@/components/ui/shared';
export default function Page() {
  const { status } = useAuth();
  if (status === 'loading') return <Loading />;
  if (status !== 'authenticated')
    return (
      <main className="mx-auto max-w-lg p-8">
        <h1 className="text-2xl font-semibold">Connect your workspace</h1>
        <p className="my-4">Live integrations require an MSFLib account.</p>
        <Link href="/login" className="text-brand">
          Sign in →
        </Link>
      </main>
    );
  return <LivePortal />;
}
