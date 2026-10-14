export type WorkspaceStrategy = 'path' | 'header';

export type WorkspaceOptions = {
  enabled?: boolean;
  strategy?: WorkspaceStrategy;
};
