import { Scale } from 'lucide-react';
import { buildTradeoffSummary } from '@/lib/vendors';
import type { Vendor } from '@/types';

export function TradeoffNote({ vendors }: { vendors: Vendor[] }) {
  const summary = buildTradeoffSummary(vendors);
  if (!summary) return null;

  return (
    <div className="flex gap-3 rounded-lg border border-brand/25 bg-brand-tint px-4 py-3">
      <Scale className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
      <div className="text-sm">
        <p className="font-medium text-brand-deep">
          Price is not the only signal
        </p>
        <p className="mt-0.5 text-ink-soft">{summary}</p>
        <p className="mt-1 text-xs text-ink-soft">
          Scores are decision support. The procurement team makes the final
          call.
        </p>
      </div>
    </div>
  );
}
