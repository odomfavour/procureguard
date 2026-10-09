'use client';
import { getPostLoginPath } from '@/lib/api/onboarding';
import { useToast } from '@/components/ui/toast-provider';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@msflib/react-auth';
import FormBuilder from '@/components/msflib/form-builder';
import OtpInput from '@msflib/react-components/otp-input';
import { field, submit } from '@/components/ui/fields';
import { Panel } from '@/components/prototype/portal';
import { requiredText } from '@/lib/schemas/procurement';
type Mode = 'login' | 'register' | 'recover' | 'reset' | 'otp';
export default function AuthScreen({ initialMode }: { initialMode: Mode }) {
  const auth = useAuth();
  const notify = useToast();
  const router = useRouter();
  const [mode, setMode] = useState(initialMode);
  const [data, setData] = useState<Record<string, unknown>>({});
  const [code, setCode] = useState('');
  const [message, setMessageState] = useState('');
  function setMessage(value: string) {
    setMessageState(value);
    if (value) notify(value, 'success');
  }
  const [error, setErrorState] = useState('');
  function setError(value: string) {
    setErrorState(value);
    if (value) notify(value, 'error');
  }
  const [busy, setBusy] = useState(false);
  const [accountType, setAccountType] = useState<'buyer' | 'vendor'>('buyer');
  const titles = {
    login: 'Welcome back',
    register: 'Create your account',
    recover: 'Recover your password',
    reset: 'Set a new password',
    otp: 'Verify your account',
  };
  const elements = [
    field('email', 'Email', 'email'),
    ...(mode === 'register'
      ? [field('firstname', 'First name'), field('lastname', 'Last name')]
      : []),
    ...(['login', 'register', 'reset'].includes(mode)
      ? [
          field(
            'password',
            mode === 'reset' ? 'New password' : 'Password',
            'password'
          ),
        ]
      : []),
    ...(mode === 'reset' ? [field('token', 'Recovery token')] : []),
    submit(titles[mode]),
  ];
  async function send(values: Record<string, unknown>) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const email = requiredText(values.email, 'Email');
      if (mode === 'login') {
        await auth.login({
          email,
          password: requiredText(values.password, 'Password'),
        });
        notify('Signed in successfully.');
        const destination = await getPostLoginPath();
        router.replace(destination);
      }
      if (mode === 'register') {
        await auth.register({
          email,
          account_type: accountType,
          profile: {
            first_name: requiredText(values.firstname, 'First name'),
            last_name: requiredText(values.lastname, 'Last name'),
          },
          password: requiredText(values.password, 'Password'),
        });
        notify('Account created. Sign in to continue.');
        router.replace(`/login?account=live&role=${accountType}`);
      }
      if (mode === 'recover') {
        await auth.recoverPassword({ email });
        setMessage('Recovery requested. Enter the token sent to your email.');
        setMode('reset');
      }
      if (mode === 'reset') {
        await auth.resetPassword({
          email,
          token: requiredText(values.token, 'Token'),
          new_password: requiredText(values.password, 'New password'),
        });
        setMode('login');
        setMessage('Password reset. Sign in to continue.');
      }
      if (mode === 'otp') {
        await auth.verifyOtp({
          email,
          code: requiredText(code, 'Verification code'),
        });
        router.replace('/dashboard');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  }
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
          title={titles[mode]}
          subtitle={
            mode === 'recover'
              ? 'Enter your email to receive password recovery instructions.'
              : mode === 'reset'
                ? 'Enter your recovery token and choose a new password.'
                : 'A safer way to procure, deliver and get paid.'
          }
        >
          {message && (
            <p role="status" className="mb-4 text-sm text-risk-low">
              {message}
            </p>
          )}
          {mode === 'otp' && (
            <OtpInput
              value={code}
              onChange={setCode}
              ariaLabel="Verification code"
              disabled={busy}
            />
          )}
          {mode === 'register' && (
            <div className="mb-4 grid grid-cols-2 gap-2">
              {(['buyer', 'vendor'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  aria-pressed={accountType === type}
                  onClick={() => setAccountType(type)}
                  className={`rounded-lg border p-3 font-medium capitalize ${accountType === type ? 'border-brand bg-brand-tint' : 'border-line'}`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
          <FormBuilder
            key={mode}
            elements={elements}
            formData={data}
            setFormData={setData}
            loadingState={busy}
            onSubmit={(values: Record<string, unknown>) => void send(values)}
          />
          {error && (
            <p role="alert" className="mt-3 text-sm text-risk-high">
              {error}
            </p>
          )}
          <p className="mt-5 text-sm text-ink-soft">
            Remember your password?{' '}
            <Link href="/login" className="font-semibold text-brand">
              Back to sign in
            </Link>
          </p>
          {mode === 'reset' && (
            <button
              type="button"
              disabled={busy}
              className="mt-3 block text-xs text-brand disabled:opacity-40"
              onClick={() => {
                setMode('recover');
                setError('');
                setMessage('');
              }}
            >
              Request another recovery token
            </button>
          )}
          {process.env.NEXT_PUBLIC_ENABLE_OTP === 'true' && mode !== 'otp' && (
            <button
              type="button"
              disabled={busy}
              className="mt-3 block text-xs text-brand disabled:opacity-40"
              onClick={() => {
                setMode('otp');
                setError('');
                setMessage('');
              }}
            >
              Verify your account
            </button>
          )}
        </Panel>
      </div>
    </div>
  );
}
