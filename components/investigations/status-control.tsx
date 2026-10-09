'use client';

import { useState } from 'react';
import { Select } from '@/components/ui/field';
import { InvestigationStatusBadge } from '@/components/investigations/status-badge';
import { updateInvestigationStatus } from '@/lib/api/procureguard';
import { INVESTIGATION_STATUS_LABELS } from '@/lib/constants';
import type { InvestigationStatus } from '@/types';

interface StatusControlProps {
  investigationId: string;
  initialStatus: InvestigationStatus;
}

export function StatusControl({
  investigationId,
  initialStatus,
}: StatusControlProps) {
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(next: InvestigationStatus) {
    const previous = status;
    setStatus(next);
    setError(null);
    try {
      await updateInvestigationStatus(investigationId, next);
    } catch {
      setStatus(previous);
      setError('The status could not be updated. Try again.');
    }
  }

  return (
    <div className="flex flex-col gap-3 px-5 py-4">
      <InvestigationStatusBadge status={status} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="investigation-status" className="text-sm font-medium">
          Update status
        </label>
        <Select
          id="investigation-status"
          value={status}
          onChange={(e) => handleChange(e.target.value as InvestigationStatus)}
        >
          {(
            Object.keys(INVESTIGATION_STATUS_LABELS) as InvestigationStatus[]
          ).map((key) => (
            <option key={key} value={key}>
              {INVESTIGATION_STATUS_LABELS[key]}
            </option>
          ))}
        </Select>
      </div>
      {error && (
        <p role="alert" className="text-sm text-risk-high">
          {error}
        </p>
      )}
    </div>
  );
}
