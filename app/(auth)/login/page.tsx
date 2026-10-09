import { AuthScreen } from '@/components/prototype/screens';
export default async function Page({ searchParams }: { searchParams: Promise<{ account?: string }> }) {
  const params = await searchParams;
  return <AuthScreen mode="login" initialLive={params.account === 'live'} />;
}
