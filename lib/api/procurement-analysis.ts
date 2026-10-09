'use client';
import { configuredApiClient } from '@msflib/core';
import { apiId } from './tenders';

export async function getApplicantAnalysis(id: string): Promise<unknown> {
  const { apiClient } = configuredApiClient({ isWorkspaceScoped: false });
  try { return await apiClient('GET', `/applications/${apiId(id)}/analysis`); }
  catch (error) {
    if (error && typeof error === 'object' && 'status' in error && error.status === 404) return null;
    throw error;
  }
}
export async function analyzeApplicant(id: string): Promise<unknown> {
  const { apiClient } = configuredApiClient({ isWorkspaceScoped: false });
  return apiClient('POST', `/applications/${apiId(id)}/analysis`);
}
export function checkoutUrl(response: unknown): string | null {
  if (!response || typeof response !== 'object') return null;
  const row = response as Record<string, unknown>;
  const nested = [row.payment, row.transaction, row.data].filter((value): value is Record<string, unknown> => !!value && typeof value === 'object');
  const candidate = [row, ...nested].map((value) => value.authorization_url ?? value.checkout_url).find((value) => typeof value === 'string');
  if (typeof candidate !== 'string') return null;
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' && !url.username && !url.password && (url.hostname === 'paystack.com' || url.hostname.endsWith('.paystack.com')) ? url.href : null;
  } catch { return null; }
}
export async function acceptApplication(id: string, callbackUrl: string): Promise<unknown> {
  const { apiClient } = configuredApiClient({ isWorkspaceScoped: false });
  return apiClient('POST', `/applications/${apiId(id)}/accept`, { callback_url: callbackUrl });
}
export async function verifyPayment(reference: string): Promise<import('./payments').PaymentRecord> {
  if (!reference.trim()) throw new Error('Payment reference is required.');
  const { apiClient } = configuredApiClient({ isWorkspaceScoped: false });
  return apiClient('GET', `/payments/verify/${encodeURIComponent(reference)}`);
}
