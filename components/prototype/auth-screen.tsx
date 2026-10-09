'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@msflib/react-auth';

import FormBuilder from '@/components/msflib/form-builder';
import { login, uid, type Role } from '@/lib/prototype';
import { requiredText } from '@/lib/schemas/procurement';
import { Panel } from './portal';
import { useData } from './common';
import { field, submit } from '@/components/ui/fields';

export function AuthScreen({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const auth = useAuth();
  const { db, update } = useData();

  const [role, setRole] = useState<Role>('buyer');
  const [live, setLive] = useState(false);

  const [values, setValues] = useState<Record<string, unknown>>({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function enter(id: string, role: Role, onboarded: boolean) {
    login(id);

    router.push(
      !onboarded
        ? `/onboarding/${role}`
        : role === 'buyer'
          ? '/dashboard'
          : '/vendor/dashboard'
    );
  }

  const fields = [
    ...(mode === 'register'
      ? [
          {
            ...field('firstName', 'First name'),
            width: 50,
          },
          {
            ...field('lastName', 'Last name'),
            width: 50,
          },
          field('organization', 'Organization name'),
        ]
      : []),

    field('email', live ? 'Work email' : 'Registered email', 'email'),

    ...(live ? [field('password', 'Password', 'password')] : []),

    submit(mode === 'register' ? 'Continue to onboarding' : 'Sign in'),
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-5">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-7 block text-center text-2xl font-bold text-brand"
        >
          ◈ ProcureGuard
        </Link>

        <Panel
          title={mode === 'login' ? 'Welcome back' : 'Create your account'}
          subtitle="A safer way to procure, deliver and get paid."
        >
          {/* Account mode selection */}
          <div className="mb-5 grid grid-cols-2 gap-2">
            {[false, true].map((real) => (
              <button
                key={String(real)}
                type="button"
                aria-pressed={live === real}
                onClick={() => {
                  setLive(real);
                  setError('');
                  setMessage('');
                  setValues({});
                }}
                className={`rounded-lg border p-2 text-sm transition-colors ${
                  live === real ? 'border-brand bg-brand-tint' : 'border-line'
                }`}
              >
                {real ? 'Live MSFLib account' : 'Demo account'}
              </button>
            ))}
          </div>

          {/* Demo account selection */}
          {!live && mode === 'login' && (
            <div className="mb-4 space-y-4">
              <p className="text-sm text-ink-soft">
                Choose a demo account or sign in with a registered email.
              </p>

              {db?.accounts.slice(0, 2).map((account) => (
                <button
                  key={account.id}
                  type="button"
                  onClick={() =>
                    enter(account.id, account.role, account.onboarded)
                  }
                  className="block w-full rounded-lg border border-line p-4 text-left transition-colors hover:border-brand"
                >
                  <strong>
                    {account.role === 'buyer' ? 'Buyer' : 'Vendor'} demo
                  </strong>

                  <span className="block text-sm text-ink-soft">
                    {account.email}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Buyer / Vendor selection */}
          {mode === 'register' && (
            <div className="mb-4 grid grid-cols-2 gap-2">
              {(['buyer', 'vendor'] as const).map((selectedRole) => (
                <button
                  key={selectedRole}
                  type="button"
                  onClick={() => setRole(selectedRole)}
                  aria-pressed={role === selectedRole}
                  className={`rounded-lg border p-3 font-medium capitalize transition-colors ${
                    role === selectedRole
                      ? 'border-brand bg-brand-tint'
                      : 'border-line'
                  }`}
                >
                  {selectedRole}
                </button>
              ))}
            </div>
          )}

          {/* Authentication form */}
          <FormBuilder
            key={`${mode}-${live}`}
            elements={fields}
            formData={values}
            setFormData={setValues}
            loadingState={auth.loading.login || auth.loading.register}
            onSubmit={async (formValues: Record<string, unknown>) => {
              setError('');
              setMessage('');

              try {
                const email = requiredText(
                  formValues.email,
                  'Email'
                ).toLowerCase();

                // Build full name from separate fields
                const fullName =
                  mode === 'register'
                    ? [
                        requiredText(formValues.firstName, 'First name'),
                        requiredText(formValues.lastName, 'Last name'),
                      ].join(' ')
                    : '';

                // Live MSFLib authentication
                if (live) {
                  const password = requiredText(
                    formValues.password,
                    'Password'
                  );

                  if (mode === 'login') {
                    await auth.login({
                      email,
                      password,
                    });

                    router.push('/workspace');
                  } else {
                    await auth.register({
                      email,
                      password,
                      firstname: requiredText(formValues.firstName, 'First name'),
                      lastname: requiredText(formValues.lastName, 'Last name'),
                      role,
                    });

                    setMessage(
                      'Account created successfully. Sign in with your live account to complete your profile and organization setup.'
                    );
                  }

                  return;
                }

                // Demo login
                if (mode === 'login') {
                  const account = db?.accounts.find(
                    (account) => account.email.toLowerCase() === email
                  );

                  if (!account) {
                    throw new Error('No demo account found for this email.');
                  }

                  enter(account.id, account.role, account.onboarded);

                  return;
                }

                // Demo registration
                if (
                  db?.accounts.some(
                    (account) => account.email.toLowerCase() === email
                  )
                ) {
                  throw new Error('Email already registered.');
                }

                const id = uid();

                update((data) => {
                  data.accounts.push({
                    id,
                    name: fullName,
                    email,
                    organization: requiredText(
                      formValues.organization,
                      'Organization name'
                    ),
                    role,
                    documents: {},
                    categories: [],
                    onboarded: false,
                  });
                });

                enter(id, role, false);
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : 'Could not complete request.'
                );
              }
            }}
          />

          {/* Error message */}
          {error && (
            <p role="alert" className="mt-3 text-sm text-risk-high">
              {error}
            </p>
          )}

          {/* Success message */}
          {message && (
            <p role="status" className="mt-3 text-sm text-risk-low">
              {message}
            </p>
          )}

          {/* Switch between login and registration */}
          <p className="mt-5 text-sm text-ink-soft">
            {mode === 'login' ? 'New to ProcureGuard?' : 'Already registered?'}{' '}
            <Link
              className="font-semibold text-brand"
              href={mode === 'login' ? '/register' : '/login'}
            >
              {mode === 'login' ? 'Create account' : 'Sign in'}
            </Link>
          </p>

          {/* Account assistance */}
          {live ? (
            <Link className="mt-3 block text-xs text-brand" href="/account">
              Password recovery and verification →
            </Link>
          ) : (
            <p className="mt-3 text-xs text-ink-soft">
              Demo-only authentication. Do not enter real credentials.
            </p>
          )}
        </Panel>
      </div>
    </div>
  );
}
