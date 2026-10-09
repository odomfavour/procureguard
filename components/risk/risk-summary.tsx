import { RiskBadge } from '@/components/risk/risk-badge';
import { ScoreBreakdown } from '@/components/risk/score-breakdown';
import { ScoreSeal } from '@/components/risk/score-seal';
import { Card, CardBody } from '@/components/ui/card';
import type { RiskAssessment } from '@/types';

export function RiskSummary({ risk }: { risk: RiskAssessment }) {
  return (
    <Card>
      <CardBody className="flex flex-col gap-6 py-6 sm:flex-row sm:items-center">
        <div className="flex flex-col items-center gap-3 sm:w-48">
          <ScoreSeal score={risk.overall} size={148} />
          <RiskBadge level={risk.level} />
        </div>
        <div className="flex flex-1 flex-col gap-5">
          <div>
            <h2 className="font-display text-base font-semibold">
              Vendor risk profile
            </h2>
            <p className="mt-1 text-sm text-ink-soft">{risk.recommendation}</p>
          </div>
          <ScoreBreakdown breakdown={risk.breakdown} />
        </div>
      </CardBody>
    </Card>
  );
}
