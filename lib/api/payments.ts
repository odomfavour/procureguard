'use client';
import { configuredApiClient } from '@msflib/core';

export type PaymentRecord = {
  id: number | string; reference: string; status: string; gateway: string;
  amount: number; email: string; description: string | null;
  created_at: string | null; updated_at: string | null;
};
export async function getPayment(id: string): Promise<PaymentRecord> {
  if (!id.trim()) throw new Error('Payment ID is required.');
  const { apiClient } = configuredApiClient({ isWorkspaceScoped: false });
  return apiClient('GET', `/payments/${encodeURIComponent(id)}`);
}
