import { Badge } from '@/components/ui/badge';
import { INVESTIGATION_STATUS_LABELS } from '@/lib/constants';
import type { InvestigationStatus } from '@/types';

const TONES = {
  open: 'high',
  awaiting_vendor: 'medium',
  resolved: 'low',
  dismissed: 'neutral',
} as const;

export function InvestigationStatusBadge({
  status,
}: {
  status: InvestigationStatus;
}) {
  return (
    <Badge tone={TONES[status]}>{INVESTIGATION_STATUS_LABELS[status]}</Badge>
  );
}
