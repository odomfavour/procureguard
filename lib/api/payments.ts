'use client';
import type { PaymentRecord } from '@/types/api/payments';
import { configuredApiClient } from '@msflib/core';

export async function getPayment(id: string): Promise<PaymentRecord> {
  if (!id.trim()) throw new Error('Payment ID is required.');
  const { apiClient } = configuredApiClient({ isWorkspaceScoped: false });
  return apiClient('GET', `/payments/${encodeURIComponent(id)}`);
}
