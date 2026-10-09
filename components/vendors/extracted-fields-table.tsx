'use client';
import { DataTable } from '@/components/msflib/data-table';
import { formatPercent } from '@/lib/utils';
import type { ExtractedField } from '@/types';
export function ExtractedFieldsTable({ fields }: { fields: ExtractedField[] }) {
  return (
    <DataTable
      title="Extracted information"
      rows={fields.map((field, index) => ({ ...field, id: `field-${index}` }))}
      columns={[
        { field: 'label', headerName: 'Field', minWidth: 160, flex: 1 },
        { field: 'value', headerName: 'Value', minWidth: 180, flex: 1 },
        {
          field: 'documentName',
          headerName: 'Read from',
          minWidth: 180,
          flex: 1,
        },
        {
          field: 'confidence',
          headerName: 'Confidence',
          width: 130,
          renderCell: ({ row }) => formatPercent(row.confidence * 100),
        },
      ]}
    />
  );
}
