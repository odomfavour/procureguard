import type { ReactNode } from 'react';

export type Column<Row> = {
  field: keyof Row & string;
  headerName: string;
  width?: number;
  flex?: number;
  minWidth?: number;
  renderCell?: (params: { row: Row }) => ReactNode;
};
