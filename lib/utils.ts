import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge conditional class names and resolve Tailwind conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function trimDecimal(n: number) {
  return Number(n.toFixed(1)).toString();
}

/** ₦74,000,000 or, with `compact`, ₦74M. */
export function formatNaira(value: number, { compact = false } = {}) {
  if (compact) {
    if (value >= 1_000_000_000)
      return `₦${trimDecimal(value / 1_000_000_000)}B`;
    if (value >= 1_000_000) return `₦${trimDecimal(value / 1_000_000)}M`;
    if (value >= 1_000) return `₦${trimDecimal(value / 1_000)}K`;
  }
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);
}

// UTC keeps server and client renders identical (no hydration mismatch).
export function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso));
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(iso));
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

/** Signed percentage difference of `a` relative to `b`. */
export function percentDiff(a: number, b: number) {
  return b === 0 ? 0 : ((a - b) / b) * 100;
}

export function average(values: number[]) {
  return values.length === 0
    ? 0
    : values.reduce((s, v) => s + v, 0) / values.length;
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function pluralize(
  count: number,
  singular: string,
  plural = `${singular}s`
) {
  return `${count} ${count === 1 ? singular : plural}`;
}
