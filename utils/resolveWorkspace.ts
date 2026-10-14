import type { WorkspaceOptions } from '@/types/workspace';

export const resolveWorkspace = (): WorkspaceOptions => {
  const workspaceMode = process.env.NEXT_PUBLIC_WORKSPACE_MODE?.toLowerCase();

  return {
    enabled: workspaceMode !== 'single',
    strategy:
      process.env.NEXT_PUBLIC_WORKSPACE_STRATEGY === 'header'
        ? 'header'
        : 'path',
  };
};
