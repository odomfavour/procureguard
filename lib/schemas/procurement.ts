export function requiredText(value: unknown, name: string): string {
  if (typeof value !== 'string' || !value.trim())
    throw new Error(`${name} is required.`);
  return value.trim();
}
export function positiveAmount(value: unknown): number {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0)
    throw new Error('Enter a positive amount.');
  return amount;
}
export function futureDate(value: unknown): string {
  const date = requiredText(value, 'Deadline');
  if (!Number.isFinite(Date.parse(date)) || Date.parse(date) <= Date.now())
    throw new Error('Choose a future deadline.');
  return date;
}
