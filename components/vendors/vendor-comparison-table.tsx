'use client';
import Link from 'next/link';
import { RiskBadge } from '@/components/risk/risk-badge';
import { ScoreSeal } from '@/components/risk/score-seal';
import { EmptyState } from '@/components/ui/empty-state';
import { DataTable, type Column } from '@/components/msflib/data-table';
import { rankVendors, priceVsOthers } from '@/lib/vendors';
import { formatNaira, formatPercent } from '@/lib/utils';
import type { Tender, Vendor } from '@/types';
export function VendorComparisonTable({
  tender,
  vendors,
}: {
  tender: Tender;
  vendors: Vendor[];
}) {
  if (!vendors.length)
    return (
      <EmptyState
        title="No submissions yet"
        description="Invite vendors to respond to this tender."
      />
    );
  const rows = rankVendors(vendors).map((v) => ({
    ...v,
    score: v.risk.overall,
    riskLabel: v.risk.level,
    price: v.offer.totalPrice,
    topIssue:
      (v.findings.find((f) => f.severity === 'critical') || v.findings[0])
        ?.title || 'None',
  }));
  type Row = (typeof rows)[number];
  const columns: Column<Row>[] = [
    {
      field: 'companyName',
      headerName: 'Vendor',
      minWidth: 210,
      flex: 1,
      renderCell: ({ row }) => (
        <div>
          <Link
            href={`/tenders/${tender.id}/vendors/${row.id}`}
            className="font-medium text-ink hover:text-brand"
          >
            {row.companyName}
          </Link>
          <p className="text-xs text-ink-soft">{row.registrationNumber}</p>
        </div>
      ),
    },
    {
      field: 'score',
      headerName: 'Score',
      width: 90,
      renderCell: ({ row }) => <ScoreSeal score={row.score} size={44} />,
    },
    {
      field: 'riskLabel',
      headerName: 'Risk',
      width: 100,
      renderCell: ({ row }) => <RiskBadge level={row.risk.level} />,
    },
    {
      field: 'complianceRate',
      headerName: 'Compliance',
      width: 110,
      renderCell: ({ row }) => formatPercent(row.complianceRate),
    },
    {
      field: 'price',
      headerName: 'Price',
      width: 160,
      renderCell: ({ row }) => (
        <div>
          {formatNaira(row.price, { compact: true })}
          <p className="text-xs text-ink-soft">
            {Math.round(priceVsOthers(row, vendors))}% vs other bids
          </p>
        </div>
      ),
    },
    { field: 'topIssue', headerName: 'Top issue', minWidth: 250, flex: 1 },
  ];
  return <DataTable rows={rows} columns={columns} title="Vendor comparison" />;
}
