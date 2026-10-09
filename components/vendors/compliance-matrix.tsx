'use client';
import { Check, X } from 'lucide-react';
import { DataTable } from '@/components/msflib/data-table';
import { COMPLIANCE_STYLES } from '@/lib/risk';
import { cn } from '@/lib/utils';
import type { ComplianceCheck } from '@/types';
export function ComplianceMatrix({ checks }: { checks: ComplianceCheck[] }) {
  return (
    <DataTable
      title="Tender compliance"
      rows={checks}
      columns={[
        { field: 'label', headerName: 'Requirement', minWidth: 180, flex: 1 },
        {
          field: 'required',
          headerName: 'Tender asks for',
          minWidth: 180,
          flex: 1,
        },
        {
          field: 'submitted',
          headerName: 'Vendor offers',
          minWidth: 180,
          flex: 1,
        },
        {
          field: 'status',
          headerName: 'Result',
          width: 150,
          renderCell: ({ row }) => {
            const { label, style } = COMPLIANCE_STYLES[row.status];
            const Icon = row.status === 'pass' ? Check : X;
            return (
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 font-medium',
                  style.text
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </span>
            );
          },
        },
      ]}
    />
  );
}
