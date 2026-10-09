import { AuthScreen } from '@/components/prototype/screens';
export default async function Page({ searchParams }: { searchParams: Promise<{ account?: string; role?: string }> }) {
  const params = await searchParams;
  return <AuthScreen mode="login" initialRole={params.role === 'vendor' ? 'vendor' : 'buyer'} />;
}
