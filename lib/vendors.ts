import { average, formatNaira, percentDiff } from '@/lib/utils';
import type { Vendor } from '@/types';

/** Rank by overall risk-adjusted score, never by price alone. */
export function rankVendors(vendors: Vendor[]): Vendor[] {
  return [...vendors].sort((a, b) => b.risk.overall - a.risk.overall);
}

/** Percent that `vendor`'s bid sits below (negative) or above the other bids' average. */
export function priceVsOthers(vendor: Vendor, all: Vendor[]) {
  const others = all
    .filter((v) => v.id !== vendor.id)
    .map((v) => v.offer.totalPrice);
  return percentDiff(vendor.offer.totalPrice, average(others));
}

export function failedRequirements(vendor: Vendor) {
  return vendor.compliance.filter((c) => c.status !== 'pass');
}

/** Plain-language trade-off between the cheapest bid and the strongest candidate. */
export function buildTradeoffSummary(vendors: Vendor[]): string | null {
  if (vendors.length < 2) return null;
  const cheapest = [...vendors].sort(
    (a, b) => a.offer.totalPrice - b.offer.totalPrice
  )[0];
  const strongest = rankVendors(vendors)[0];
  if (cheapest.id === strongest.id) {
    return `${cheapest.companyName} has the lowest bid and the strongest overall profile.`;
  }
  const gap = strongest.offer.totalPrice - cheapest.offer.totalPrice;
  const failed = failedRequirements(cheapest).length;
  return `${cheapest.companyName} is ${formatNaira(gap, { compact: true })} cheaper than ${strongest.companyName}, but ${
    failed > 0
      ? `does not meet ${failed} of ${cheapest.compliance.length} requirements`
      : 'carries a higher risk profile'
  } and is rated ${cheapest.risk.level} risk.`;
}
