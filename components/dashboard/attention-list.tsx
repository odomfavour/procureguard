import Link from 'next/link';
import { CircleAlert } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import type { AttentionItem } from '@/types';

export function AttentionList({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Nothing needs review"
        description="New findings appear here as vendors submit documents."
      />
    );
  }

  return (
    <ul className="divide-y divide-line">
      {items.map(({ finding, vendorName, tenderId }) => (
        <li key={finding.id}>
          <Link
            href={`/tenders/${tenderId}/vendors/${finding.vendorId}`}
            className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-paper/60"
          >
            <CircleAlert
              className="mt-0.5 size-4 shrink-0 text-risk-high"
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-sm font-medium">{finding.title}</p>
              <p className="text-xs text-ink-soft">{vendorName}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
