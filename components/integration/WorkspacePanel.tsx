'use client';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { setActiveWorkspace } from '@msflib/core';
import { useActiveWorkspace } from '@msflib/react-shared';
import { useWorkspace } from '@msflib/react-workspace';
import { Section } from '@/components/ui/shared';
export default function WorkspacePanel({
  run,
}: {
  run: (action: () => Promise<unknown>) => void;
}) {
  const api = useWorkspace();
  const active = useActiveWorkspace();
  const client = useQueryClient();
  const [name, setName] = useState('');
  return (
    <Section title="Organization workspace">
      <label>
        Active organization
        <select
          value={active || ''}
          onChange={(e) => {
            void client.cancelQueries();
            client.removeQueries({
              predicate: (q) => !q.queryKey.includes('auth'),
            });
            setActiveWorkspace(e.target.value || null);
          }}
        >
          <option value="">Select an organization</option>
          {api.availableWorkspaces.map((w) => (
            <option key={w.id} value={w.slug}>
              {w.label || w.name}
            </option>
          ))}
        </select>
      </label>
      <div className="actions">
        <input
          aria-label="Organization name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          disabled={api.loading.create || !name.trim()}
          onClick={() =>
            run(async () => {
              const fd = new FormData();
              fd.append('name', name.trim());
              fd.append('label', name.trim());
              const w = await api.createWorkspace(fd);
              setName('');
              api.refetch();
              setActiveWorkspace(w.slug);
            })
          }
        >
          Create organization
        </button>
        <button onClick={api.refetch}>Refresh workspaces</button>
      </div>
      <p className="hint">
        Only available memberships are offered for switching. API authorization
        must enforce access.
      </p>
    </Section>
  );
}
