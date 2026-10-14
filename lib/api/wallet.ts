'use client';
import { configuredApiClient } from '@msflib/core';
import type { WalletRecord, WithdrawalInput, WithdrawalRecord } from '@/types/api/wallet';

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Unrecognised wallet response.');
  return value as Record<string, unknown>;
}
function decimal(value: unknown): string {
  if ((typeof value !== 'string' && typeof value !== 'number') || !/^\d+(\.\d{1,2})?$/.test(String(value))) throw new Error('Enter a valid amount with at most two decimal places.');
  const [whole, fraction = ''] = String(value).split('.');
  if (BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, '0')) > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Amount exceeds the supported monetary range.');
  return String(value);
}
function minorUnits(value: string): bigint {
  const [whole, fraction = ''] = decimal(value).split('.');
  return BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, '0'));
}
// Provisional explicit-field contract: confirm with authenticated API samples.
// Never substitute total balance or held escrow for available_balance.
export function parseWallet(value: unknown): WalletRecord {
  const envelope = object(value);
  const row = envelope.wallet ? object(envelope.wallet) : envelope;
  if (typeof row.currency !== 'string' || !/^[A-Z]{3}$/.test(row.currency)) throw new Error('Wallet currency was not provided.');
  try { new Intl.NumberFormat('en', { style: 'currency', currency: row.currency }); } catch { throw new Error('Invalid wallet currency.'); }
  return { availableBalance: decimal(row.available_balance), currency: row.currency };
}
export function parseWithdrawals(value: unknown): WithdrawalRecord[] {
  const rows = Array.isArray(value) ? value : object(value).withdrawals;
  if (!Array.isArray(rows)) throw new Error('Unrecognised withdrawal history response.');
  return rows.map((value) => {
    const row = object(value);
    if (row.id == null || typeof row.status !== 'string' || !row.status.trim()) throw new Error('Invalid withdrawal history record.');
    return { id: String(row.id), amount: decimal(row.amount), status: row.status,
      bankName: String(row.bank_name ?? ''), accountName: String(row.account_name ?? ''),
      accountNumber: String(row.account_number ?? ''), createdAt: String(row.created_at ?? '') };
  });
}
function validateFields(input: WithdrawalInput): WithdrawalInput {
  const amount = decimal(input.amount.trim());
  if (minorUnits(amount) <= BigInt(0)) throw new Error('Withdrawal amount must be greater than zero.');
  const result = { amount, bank_name: input.bank_name.trim(), account_name: input.account_name.trim(), account_number: input.account_number.trim() };
  for (const [key, min, max] of [['bank_name', 2, 120], ['account_name', 2, 200], ['account_number', 10, 20]] as const) {
    if (result[key].length < min || result[key].length > max) throw new Error(`${key.replaceAll('_', ' ')} must be ${min}–${max} characters.`);
  }
  return result;
}
export function validateWithdrawal(input: WithdrawalInput, availableBalance: string): WithdrawalInput {
  const result = validateFields(input);
  if (minorUnits(result.amount) > minorUnits(availableBalance)) throw new Error('Withdrawal amount exceeds your available balance.');
  return result;
}
export async function getWallet(): Promise<WalletRecord> {
  const { apiClient } = configuredApiClient({ isWorkspaceScoped: false });
  return parseWallet(await apiClient<unknown>('GET', '/wallet'));
}
export async function listWithdrawals(): Promise<WithdrawalRecord[]> {
  const { apiClient } = configuredApiClient({ isWorkspaceScoped: false });
  return parseWithdrawals(await apiClient<unknown>('GET', '/wallet/withdrawals'));
}
export async function createWithdrawal(input: WithdrawalInput): Promise<unknown> {
  const payload = validateFields(input);
  const { apiClient } = configuredApiClient({ isWorkspaceScoped: false });
  return apiClient<unknown>('POST', '/wallet/withdrawals', payload);
}
