import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number;
  hint: string;
  tone?: 'default' | 'alert';
}

export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
}: StatCardProps) {
  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      <p className="text-sm text-ink-soft">{label}</p>
      <p
        className={cn(
          'mt-2 font-display text-4xl font-semibold tabular-nums',
          tone === 'alert' && value > 0 && 'text-risk-high'
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-ink-soft">{hint}</p>
    </div>
  );
}
