import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Plan } from '@/types';

export function PlanCard({ plan, current }: { plan: Plan; current: boolean }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-lg border bg-surface p-5',
        current ? 'border-brand' : 'border-line'
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">{plan.name}</h3>
        {current && <Badge tone="brand">Current plan</Badge>}
      </div>
      <p className="text-sm font-medium tabular-nums">{plan.priceLabel}</p>
      <ul className="flex flex-col gap-2 text-sm text-ink-soft">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-center gap-2">
            <Check className="size-4 shrink-0 text-risk-low" aria-hidden />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}
