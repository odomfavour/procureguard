'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { getApplicationConfig, setActiveWorkspace, storage } from '@msflib/core';
import { getTokenExpiry } from '@/lib/auth/token-expiry';
import { useToast } from '@/components/ui/toast-provider';

export function SessionExpiry() {
  const client = useQueryClient();
  const router = useRouter();
  const notify = useToast();

  useEffect(() => {
    const key = getApplicationConfig().accessTokenKey;
    let timer: ReturnType<typeof setTimeout>;
    let expiring = false;
    const expire = () => {
      if (expiring || !storage.getItem(key)) return;
      expiring = true;
      storage.removeItem(key);
      storage.removeItem(`${key}_expiry`);
      // Clear the independent demo session so it cannot mask an expired live session.
      storage.removeItem('procureguard-session-v2');
      window.dispatchEvent(new Event('pg-updated'));
      void client.cancelQueries();
      client.setQueryData(['msflib', 'auth', 'me'], null);
      client.removeQueries({ predicate: (query) => !query.queryKey.includes('auth') });
      setActiveWorkspace(null);
      notify('Your session has expired. Please sign in again.', 'error');
      router.replace('/login?account=live');
    };
    const check = () => {
      clearTimeout(timer);
      const token = storage.getItem(key);
      if (!token) return;
      expiring = false;
      const expiresAt = getTokenExpiry(token);
      if (expiresAt === null) return;
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) expire();
      else timer = setTimeout(check, Math.min(remaining, 2_147_483_647));
    };
    const unsubscribe = client.getQueryCache().subscribe((event) => {
      const error = event.query.state.error;
      if (error && typeof error === 'object' && 'status' in error && error.status === 401) expire();
    });
    const unsubscribeMutations = client.getMutationCache().subscribe((event) => {
      if (!('mutation' in event) || !event.mutation) return;
      const error = event.mutation.state.error;
      if (error && typeof error === 'object' && 'status' in error && error.status === 401) check();
    });
    check();
    window.addEventListener('procureguard-auth-updated', check);
    window.addEventListener('storage', check);
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearTimeout(timer);
      unsubscribe();
      unsubscribeMutations();
      window.removeEventListener('procureguard-auth-updated', check);
      window.removeEventListener('storage', check);
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', check);
    };
  }, [client, router, notify]);

  return null;
}
