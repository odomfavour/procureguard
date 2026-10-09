'use client';
import { DataTable } from '@/components/msflib/data-table';
import { formatNaira } from '@/lib/utils';
import type { Milestone } from '@/types';
export function MilestoneTable({ milestones }: { milestones: Milestone[] }) {
  return (
    <DataTable
      rows={milestones}
      title="Milestone payments"
      columns={[
        { field: 'label', headerName: 'Milestone', flex: 1, minWidth: 160 },
        { field: 'percent', headerName: 'Share (%)', width: 130 },
        {
          field: 'amount',
          headerName: 'Amount',
          flex: 1,
          minWidth: 170,
          renderCell: ({ row }) => formatNaira(row.amount),
        },
      ]}
    />
  );
}
