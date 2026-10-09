import type {
  CheckStatus,
  ComplianceStatus,
  FindingSeverity,
  RiskLevel,
  VerificationCheck,
} from '@/types';

/** 80+ is low risk, 60-79 medium, below 60 high. */
export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 80) return 'low';
  if (score >= 60) return 'medium';
  return 'high';
}

interface ToneStyle {
  label: string;
  text: string;
  bg: string;
  border: string;
  stroke: string;
  bar: string;
  dot: string;
}

// Full class names must appear literally so Tailwind can detect them.
export const RISK_STYLES: Record<RiskLevel, ToneStyle> = {
  low: {
    label: 'Low risk',
    text: 'text-risk-low',
    bg: 'bg-risk-low-bg',
    border: 'border-risk-low/30',
    stroke: 'stroke-risk-low',
    bar: 'bg-risk-low',
    dot: 'bg-risk-low',
  },
  medium: {
    label: 'Medium risk',
    text: 'text-risk-medium',
    bg: 'bg-risk-medium-bg',
    border: 'border-risk-medium/30',
    stroke: 'stroke-risk-medium',
    bar: 'bg-risk-medium',
    dot: 'bg-risk-medium',
  },
  high: {
    label: 'High risk',
    text: 'text-risk-high',
    bg: 'bg-risk-high-bg',
    border: 'border-risk-high/30',
    stroke: 'stroke-risk-high',
    bar: 'bg-risk-high',
    dot: 'bg-risk-high',
  },
};

export const SEVERITY_STYLES: Record<FindingSeverity, ToneStyle> = {
  critical: { ...RISK_STYLES.high, label: 'Needs review' },
  warning: { ...RISK_STYLES.medium, label: 'Inconsistency' },
  info: {
    label: 'Note',
    text: 'text-brand',
    bg: 'bg-brand-tint',
    border: 'border-brand/25',
    stroke: 'stroke-brand',
    bar: 'bg-brand',
    dot: 'bg-brand',
  },
};

export const CHECK_STYLES: Record<
  CheckStatus,
  { label: string; style: ToneStyle }
> = {
  verified: { label: 'Verified', style: RISK_STYLES.low },
  warning: { label: 'Check needed', style: RISK_STYLES.medium },
  failed: { label: 'Failed', style: RISK_STYLES.high },
};

export const COMPLIANCE_STYLES: Record<
  ComplianceStatus,
  { label: string; style: ToneStyle }
> = {
  pass: { label: 'Meets requirement', style: RISK_STYLES.low },
  fail: { label: 'Below requirement', style: RISK_STYLES.high },
  missing: { label: 'Not provided', style: RISK_STYLES.high },
};

/** Verified = full credit, warning = partial credit, failed = none. */
export function verificationScore(checks: VerificationCheck[]) {
  if (checks.length === 0) return 0;
  const points = checks.reduce(
    (sum, c) =>
      sum + (c.status === 'verified' ? 1 : c.status === 'warning' ? 0.6 : 0),
    0
  );
  return Math.round((points / checks.length) * 100);
}

/** Decision-support wording only; never labels a vendor fraudulent. */
export function recommendationFor(level: RiskLevel) {
  switch (level) {
    case 'low':
      return 'Suitable for procurement review.';
    case 'medium':
      return 'Review the flagged items before shortlisting.';
    case 'high':
      return 'Requires enhanced verification before any commitment.';
  }
}
