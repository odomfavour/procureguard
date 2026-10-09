import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  barClassName?: string;
  label: string;
}

export function ProgressBar({
  value,
  barClassName = 'bg-brand',
  label,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-1.5 w-full overflow-hidden rounded-full bg-paper"
    >
      <div
        className={cn('h-full rounded-full', barClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
