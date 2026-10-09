import { Check, TriangleAlert, X } from 'lucide-react';
import { CHECK_STYLES } from '@/lib/risk';
import { cn } from '@/lib/utils';
import type { CheckStatus, VerificationCheck } from '@/types';

const ICONS: Record<CheckStatus, typeof Check> = {
  verified: Check,
  warning: TriangleAlert,
  failed: X,
};

export function VerificationPanel({ checks }: { checks: VerificationCheck[] }) {
  return (
    <ul className="divide-y divide-line">
      {checks.map((check) => {
        const { label, style } = CHECK_STYLES[check.status];
        const Icon = ICONS[check.status];
        return (
          <li key={check.id} className="flex items-start gap-3 px-5 py-3">
            <span
              className={cn(
                'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full',
                style.bg,
                style.text
              )}
            >
              <Icon className="size-3" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-medium">{check.label}</span>
                <span className={cn('text-xs font-medium', style.text)}>
                  {label}
                </span>
              </div>
              {check.note && (
                <p className="mt-0.5 text-xs text-ink-soft">{check.note}</p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
