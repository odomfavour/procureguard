import type { CSSProperties } from 'react';
import { RISK_STYLES, riskLevelFromScore } from '@/lib/risk';
import { cn } from '@/lib/utils';

interface ScoreSealProps {
  score: number;
  size?: number;
  className?: string;
}

const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Circular score mark: a dotted outer ring, a track, and an arc coloured by risk level. */
export function ScoreSeal({ score, size = 140, className }: ScoreSealProps) {
  const level = riskLevelFromScore(score);
  const style = RISK_STYLES[level];

  return (
    <div
      className={cn('relative shrink-0', className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 120 120"
        className="size-full"
        role="img"
        aria-label={`Score ${score} out of 100, ${style.label}`}
      >
        <circle
          cx="60"
          cy="60"
          r="56"
          fill="none"
          strokeWidth="1.5"
          strokeDasharray="1 5"
          strokeLinecap="round"
          className="stroke-line"
        />
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          strokeWidth="8"
          className="stroke-paper"
        />
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - score / 100)}
          transform="rotate(-90 60 60)"
          className={cn('seal-arc', style.stroke)}
          style={{ '--seal-circumference': CIRCUMFERENCE } as CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span
          className="font-display font-semibold leading-none tabular-nums"
          style={{ fontSize: size * 0.3 }}
        >
          {score}
        </span>
      </div>
    </div>
  );
}
