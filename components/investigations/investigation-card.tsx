import Link from 'next/link';
import { FileText, MessageSquare, UserRound } from 'lucide-react';
import { InvestigationStatusBadge } from '@/components/investigations/status-badge';
import { formatDate } from '@/lib/utils';
import type { Investigation } from '@/types';

export function InvestigationCard({
  investigation,
}: {
  investigation: Investigation;
}) {
  return (
    <Link
      href={`/investigations/${investigation.id}`}
      className="group flex flex-col gap-3 rounded-lg border border-line bg-surface p-5 transition-colors hover:border-brand/40"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-ink-soft">
          {investigation.code}
        </span>
        <InvestigationStatusBadge status={investigation.status} />
      </div>
      <div>
        <h3 className="font-display text-base font-semibold group-hover:text-brand">
          {investigation.title}
        </h3>
        <p className="mt-0.5 text-sm text-ink-soft">
          {investigation.vendorName}
        </p>
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 text-xs text-ink-soft">
        <span className="flex items-center gap-1">
          <UserRound className="size-3.5" aria-hidden />
          {investigation.assignee}
        </span>
        <span className="flex items-center gap-1">
          <FileText className="size-3.5" aria-hidden />
          {investigation.evidence.length} evidence
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="size-3.5" aria-hidden />
          {investigation.comments.length}
        </span>
        <span className="ml-auto">{formatDate(investigation.openedAt)}</span>
      </div>
    </Link>
  );
}
