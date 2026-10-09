import Link from 'next/link';
import { CalendarClock, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TENDER_STATUS_LABELS } from '@/lib/constants';
import { formatDate, formatNaira, pluralize } from '@/lib/utils';
import type { Tender } from '@/types';

export function TenderCard({ tender }: { tender: Tender }) {
  return (
    <Link
      href={`/tenders/${tender.id}`}
      className="group flex flex-col gap-4 rounded-lg border border-line bg-surface p-5 transition-colors hover:border-brand/40"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg font-semibold leading-snug group-hover:text-brand">
          {tender.title}
        </h3>
        <Badge tone={tender.status === 'draft' ? 'neutral' : 'brand'}>
          {TENDER_STATUS_LABELS[tender.status]}
        </Badge>
      </div>
      <p className="line-clamp-2 text-sm text-ink-soft">{tender.description}</p>
      <dl className="mt-auto grid grid-cols-3 gap-3 border-t border-line pt-4 text-sm">
        <div>
          <dt className="text-xs text-ink-soft">Budget</dt>
          <dd className="font-medium tabular-nums">
            {formatNaira(tender.requirements.maxBudget, { compact: true })}
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-1 text-xs text-ink-soft">
            <Users className="size-3" aria-hidden /> Vendors
          </dt>
          <dd className="font-medium">
            {pluralize(tender.vendorCount, 'vendor')}
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-1 text-xs text-ink-soft">
            <CalendarClock className="size-3" aria-hidden /> Closes
          </dt>
          <dd className="font-medium">{formatDate(tender.deadline)}</dd>
        </div>
      </dl>
    </Link>
  );
}
