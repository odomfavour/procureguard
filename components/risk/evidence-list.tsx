import { FileText } from 'lucide-react';
import type { Evidence } from '@/types';

export function EvidenceList({ evidence }: { evidence: Evidence[] }) {
  if (evidence.length === 0) {
    return (
      <p className="rounded-md bg-paper px-3 py-2 text-sm text-ink-soft">
        No document backs this finding because the required document was not
        submitted.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {evidence.map((item, index) => (
        <li
          key={`${item.documentId}-${index}`}
          className="rounded-md border border-line bg-paper px-3 py-2.5"
        >
          <div className="flex items-center gap-2 text-xs font-medium text-ink-soft">
            <FileText className="size-3.5" aria-hidden />
            <span>{item.documentName}</span>
            {item.field && (
              <span className="text-ink-soft/70">/ {item.field}</span>
            )}
          </div>
          <p className="mt-1 text-sm">&ldquo;{item.excerpt}&rdquo;</p>
        </li>
      ))}
    </ul>
  );
}
