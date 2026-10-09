import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'brand' | 'low' | 'medium' | 'high';

const TONES: Record<Tone, string> = {
  neutral: 'bg-paper text-ink-soft border-line',
  brand: 'bg-brand-tint text-brand border-brand/25',
  low: 'bg-risk-low-bg text-risk-low border-risk-low/30',
  medium: 'bg-risk-medium-bg text-risk-medium border-risk-medium/30',
  high: 'bg-risk-high-bg text-risk-high border-risk-high/30',
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        TONES[tone],
        className
      )}
      {...props}
    />
  );
}
