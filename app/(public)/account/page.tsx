import AuthScreen from '@/components/auth/AuthScreen';
export default function Page() {
  return (
    <main className="mx-auto max-w-lg p-6">
      <AuthScreen initialMode="recover" />
    </main>
  );
}
