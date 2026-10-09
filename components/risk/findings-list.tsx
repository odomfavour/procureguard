'use client';

import { useState } from 'react';
import { ChevronDown, TriangleAlert, Info, CircleAlert } from 'lucide-react';
import { EvidenceList } from '@/components/risk/evidence-list';
import { EmptyState } from '@/components/ui/empty-state';
import { SEVERITY_STYLES } from '@/lib/risk';
import { cn } from '@/lib/utils';
import type { Finding, FindingSeverity } from '@/types';

const ICONS: Record<FindingSeverity, typeof Info> = {
  critical: CircleAlert,
  warning: TriangleAlert,
  info: Info,
};

function FindingItem({ finding }: { finding: Finding }) {
  const [open, setOpen] = useState(false);
  const style = SEVERITY_STYLES[finding.severity];
  const Icon = ICONS[finding.severity];
  const panelId = `evidence-${finding.id}`;

  return (
    <li className="px-5 py-4">
      <div className="flex gap-3">
        <span
          className={cn(
            'mt-0.5 grid size-7 shrink-0 place-items-center rounded-md',
            style.bg,
            style.text
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-sm font-semibold">{finding.title}</h3>
            <span className={cn('text-xs font-medium', style.text)}>
              {style.label}
            </span>
          </div>
          <p className="text-sm text-ink-soft">{finding.description}</p>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={panelId}
            className="mt-1 inline-flex w-fit items-center gap-1 text-sm font-medium text-brand hover:text-brand-deep"
          >
            {open ? 'Hide evidence' : 'Show evidence'}
            <ChevronDown
              className={cn(
                'size-4 transition-transform',
                open && 'rotate-180'
              )}
              aria-hidden
            />
          </button>
          {open && (
            <div id={panelId} className="mt-2">
              <EvidenceList evidence={finding.evidence} />
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

export function FindingsList({ findings }: { findings: Finding[] }) {
  if (findings.length === 0) {
    return (
      <EmptyState
        title="No findings"
        description="The analysis did not flag anything for this vendor."
      />
    );
  }
  return (
    <ul className="divide-y divide-line">
      {findings.map((finding) => (
        <FindingItem key={finding.id} finding={finding} />
      ))}
    </ul>
  );
}
