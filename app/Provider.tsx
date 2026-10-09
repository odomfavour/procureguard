'use client';
import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@msflib/react-auth';
import { WorkspaceProvider } from '@msflib/react-workspace';
import { ProfileProvider } from '@msflib/react-profile';
import { DocumentsProvider } from '@msflib/react-documents';
import { AiProvider } from '@msflib/react-ai';
import { NotificationProvider } from '@msflib/react-notification';
import { ThemeProvider } from '@/theme/Themeprovider';
import { useActiveWorkspace } from '@msflib/react-shared';
import { initMsflib } from '@/lib/application.config';

initMsflib();
function Modules({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const workspace = useActiveWorkspace();
  const options = {
    requireAuth: true,
    isAuthenticated:
      status === 'authenticated' &&
      (process.env.NEXT_PUBLIC_WORKSPACE_MODE === 'single' || !!workspace),
    isWorkspaceScoped: true,
  };
  return (
    <WorkspaceProvider
      options={{
        ...options,
        isAuthenticated: status === 'authenticated',
        pathWorkspaceScope: { available: false },
      }}
    >
      <ProfileProvider options={options}>
        <DocumentsProvider options={options}>
          <AiProvider options={options}>
            <NotificationProvider options={options}>
              {children}
            </NotificationProvider>
          </AiProvider>
        </DocumentsProvider>
      </ProfileProvider>
    </WorkspaceProvider>
  );
}
export default function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
      })
  );
  return (
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <AuthProvider options={{ isWorkspaceScoped: false }}>
          <Modules>{children}</Modules>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
