'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@msflib/react-auth';
import FormBuilder from '@/components/msflib/form-builder';
import { field, submit } from '@/components/ui/fields';
export function LoginForm() {
  const auth = useAuth();
  const router = useRouter();
  const [data, setData] = useState<Record<string, unknown>>({});
  const [error, setError] = useState('');
  return (
    <>
      <FormBuilder
        elements={[
          field('email', 'Work email', 'email'),
          field('password', 'Password', 'password'),
          submit('Sign in'),
        ]}
        formData={data}
        setFormData={setData}
        loadingState={auth.loading.login}
        onSubmit={async (values: Record<string, unknown>) => {
          setError('');
          try {
            await auth.login({
              email: String(values.email),
              password: String(values.password),
            });
            router.push('/workspace');
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Sign in failed.');
          }
        }}
      />
      {error && (
        <p role="alert" className="mt-3 text-sm text-risk-high">
          {error}
        </p>
      )}
      <div className="mt-5 flex flex-wrap gap-4 text-sm text-brand">
        <Link href="/register">Create account / recover password</Link>
        <Link href="/dashboard">Explore demo workspace →</Link>
      </div>
      <p className="mt-4 text-xs text-ink-soft">
        Sign in uses the live MSFLib backend. Demo screens use fictional data.
      </p>
    </>
  );
}
