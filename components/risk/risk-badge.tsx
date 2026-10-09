import { Badge } from '@/components/ui/badge';
import { RISK_STYLES } from '@/lib/risk';
import { cn } from '@/lib/utils';
import type { RiskLevel } from '@/types';

export function RiskBadge({ level }: { level: RiskLevel }) {
  const style = RISK_STYLES[level];
  return (
    <Badge tone={level}>
      <span className={cn('size-1.5 rounded-full', style.dot)} aria-hidden />
      {style.label}
    </Badge>
  );
}
