'use client';
import { useEffect } from 'react';
import { useAuth } from '@msflib/react-auth';
import { useRouter } from 'next/navigation';
import { PageLoader } from '@/components/ui/page-loader';

export default function Page() {
  const auth = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (auth.status === 'loading') return;
    if (auth.status !== 'authenticated') {
      router.replace('/login?account=live');
      return;
    }
    const vendor = auth.me?.data?.account_type === 'vendor' || auth.me?.role === 'vendor';
    router.replace(vendor ? '/vendor/dashboard' : '/dashboard');
  }, [auth.status, auth.me, router]);
  return <PageLoader />;
}
