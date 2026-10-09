import { Badge } from '@/components/ui/badge';
import { DOCUMENT_LABELS } from '@/lib/constants';
import { formatNaira } from '@/lib/utils';
import type { TenderRequirements } from '@/types';

export function RequirementsSummary({
  requirements,
}: {
  requirements: TenderRequirements;
}) {
  const items = [
    { label: 'Quantity', value: `${requirements.quantity} units` },
    {
      label: 'Maximum budget',
      value: formatNaira(requirements.maxBudget, { compact: true }),
    },
    { label: 'Memory', value: `${requirements.minRamGb}GB or more` },
    { label: 'Storage', value: `${requirements.minStorageGb}GB SSD or more` },
    {
      label: 'Warranty',
      value: `${requirements.minWarrantyYears} years or more`,
    },
    {
      label: 'Delivery',
      value: `${requirements.maxDeliveryDays} days or fewer`,
    },
  ];

  return (
    <div className="flex flex-col gap-4 px-5 py-4">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-xs text-ink-soft">{item.label}</dt>
            <dd className="text-sm font-medium tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>
      <div>
        <p className="mb-2 text-xs text-ink-soft">Required documents</p>
        <div className="flex flex-wrap gap-1.5">
          {requirements.requiredDocuments.map((doc) => (
            <Badge key={doc}>{DOCUMENT_LABELS[doc]}</Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
