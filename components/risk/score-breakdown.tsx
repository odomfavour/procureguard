import { ProgressBar } from '@/components/ui/progress-bar';
import { RISK_STYLES, riskLevelFromScore } from '@/lib/risk';
import type { RiskBreakdown } from '@/types';

const ROWS: { key: keyof RiskBreakdown; label: string }[] = [
  { key: 'identity', label: 'Identity verification' },
  { key: 'documentConsistency', label: 'Document consistency' },
  { key: 'tenderCompliance', label: 'Tender compliance' },
  { key: 'financialConsistency', label: 'Financial consistency' },
  { key: 'requiredDocuments', label: 'Required documents' },
];

export function ScoreBreakdown({ breakdown }: { breakdown: RiskBreakdown }) {
  return (
    <dl className="flex flex-col gap-3">
      {ROWS.map(({ key, label }) => {
        const value = breakdown[key];
        const style = RISK_STYLES[riskLevelFromScore(value)];
        return (
          <div key={key} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between text-sm">
              <dt className="text-ink-soft">{label}</dt>
              <dd className="font-medium tabular-nums">{value}%</dd>
            </div>
            <ProgressBar value={value} barClassName={style.bar} label={label} />
          </div>
        );
      })}
    </dl>
  );
}
