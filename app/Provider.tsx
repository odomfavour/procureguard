'use client';
import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@msflib/react-auth';
import { ThemeProvider } from '@/theme/Themeprovider';
import { initMsflib } from '@/lib/application.config';
import { ToastProvider } from '@/components/ui/toast-provider';
import { SessionExpiry } from '@/components/auth/session-expiry';

export default function Providers({ children, apiURL }: { children: React.ReactNode; apiURL: string }) {
  initMsflib(apiURL);
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
      })
  );
  return (
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <ToastProvider>
        <AuthProvider options={{ isWorkspaceScoped: false }}>
          <SessionExpiry />
          {children}
        </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
