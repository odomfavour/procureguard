'use client';
import { configureApplication } from '@msflib/core';
import { workspaceHookDecorator } from '@msflib/react-workspace';
import { resolveWorkspace } from '@/utils/resolveWorkspace';

export function initMsflib() {
  const scope = resolveWorkspace();
  configureApplication({
    baseURL: (process.env.NEXT_PUBLIC_API_URL || 'https://procure-api-mqlx.onrender.com/api/v1').replace(/\/$/, ''),
    accessTokenKey:
      process.env.NEXT_PUBLIC_ACCESS_TOKEN_KEY || 'procureguard_access_token',
    apiClientDecorator: scope.enabled
      ? workspaceHookDecorator(scope.strategy)
      : undefined,
    workspace: scope.enabled
      ? process.env.NEXT_PUBLIC_DEFAULT_TENANT?.trim() || null
      : null,
    endpoints: {
      auth: {
        register: '/account/signup',
        login: '/auth/login',
        me: '/account/me',
        recoverPassword: '/auth/password-recovery',
        verifyToken: '/auth/verify-token',
        resetPassword: '/auth/reset-password',
        logout: '/auth/logout',
      },
    },
  });
}
