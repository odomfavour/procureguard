'use client';
import type { ReactNode } from 'react';
import TableWidget from '@msflib/react-components/table';
export type Column<Row> = {
  field: keyof Row & string;
  headerName: string;
  width?: number;
  flex?: number;
  minWidth?: number;
  renderCell?: (params: { row: Row }) => ReactNode;
};
export function DataTable<Row extends { id: string }>({
  rows,
  columns,
  title,
}: {
  rows: Row[];
  columns: Column<Row>[];
  title: string;
}) {
  return (
    <div className="min-w-0 overflow-x-auto">
      <TableWidget
        rows={rows}
        columns={columns}
        tableTitle={title}
        enableSearch
        pageSize={20}
        pageSizeOptions={[10, 20, 50, 100]}
        autoHeight
        styles={{
          root: { border: 0, fontSize: 14, color: '#111b33' },
          header: { backgroundColor: '#f1f3f6', color: '#55607a' },
          rowHover: { backgroundColor: '#f1f3f6' },
        }}
      />
    </div>
  );
}
