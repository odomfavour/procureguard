import type { Milestone } from '@/types';

/** Split a contract value into percentage-based payment milestones. */
export function buildMilestones(
  contractValue: number,
  split: readonly number[]
): Milestone[] {
  return split.map((percent, index) => ({
    id: `m${index + 1}`,
    label: `Milestone ${index + 1}`,
    percent,
    amount: Math.round((contractValue * percent) / 100),
  }));
}
