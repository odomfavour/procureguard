'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@msflib/react-auth';
import FormBuilder from '@/components/msflib/form-builder';
import OtpInput from '@msflib/react-components/otp-input';
import { field, submit } from '@/components/ui/fields';
import { ErrorState } from '@/components/ui/shared';
import { requiredText } from '@/lib/schemas/procurement';
type Mode = 'login' | 'register' | 'recover' | 'reset' | 'otp';
export default function AuthScreen({ initialMode }: { initialMode: Mode }) {
  const auth = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState(initialMode);
  const [data, setData] = useState<Record<string, unknown>>({});
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const titles = {
    login: 'Welcome back',
    register: 'Create your account',
    recover: 'Recover your password',
    reset: 'Set a new password',
    otp: 'Verify your account',
  };
  const elements = [
    field('email', 'Email', 'email'),
    ...(mode === 'register' ? [field('username', 'Username')] : []),
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
        router.replace('/dashboard');
      }
      if (mode === 'register') {
        await auth.register({
          email,
          username: requiredText(values.username, 'Username'),
          password: requiredText(values.password, 'Password'),
        });
        setMessage(
          'Account created. Sign in or verify your account if required by your organization.'
        );
        setMode('login');
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
    <div className="integration rounded-xl border border-line bg-white p-6">
      <Link href="/" className="brand">
        ◈ ProcureGuard
      </Link>
      <h1>{titles[mode]}</h1>
      <p>Secure procurement starts with your organization.</p>
      <ErrorState message={error} />
      {message && <p role="status">{message}</p>}
      {mode === 'otp' && (
        <OtpInput
          value={code}
          onChange={setCode}
          ariaLabel="Verification code"
          disabled={busy}
        />
      )}
      <FormBuilder
        key={mode}
        elements={elements}
        formData={data}
        setFormData={setData}
        loadingState={busy}
        onSubmit={(values: Record<string, unknown>) => void send(values)}
      />
      <div className="actions">
        <Link href={mode === 'register' ? '/login' : '/register'}>
          {mode === 'register' ? 'Sign in' : 'Create account'}
        </Link>
        <button onClick={() => setMode('recover')}>Forgot password?</button>
        {process.env.NEXT_PUBLIC_ENABLE_OTP === 'true' && (
          <button onClick={() => setMode('otp')}>Use OTP</button>
        )}
      </div>
      <p className="hint">
        Live authentication requires a configured MSFLib backend.
      </p>
      <Link className="button secondary" href="/demo">
        Explore the interactive demo
      </Link>
    </div>
  );
}
