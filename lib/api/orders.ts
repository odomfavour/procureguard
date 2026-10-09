'use client';
import { configuredApiClient } from '@msflib/core';
import { apiId } from './tenders';

export type OrderRecord = {
  id: string; title: string; buyer: string; vendor: string; amount: number | null;
  status: string; escrowStatus: string; tracking: string; note: string; createdAt: string;
};
function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
export function parseOrder(value: unknown): OrderRecord {
  const envelope = object(value);
  const row = envelope.order ? object(envelope.order) : envelope;
  if (row.id == null) throw new Error('Invalid order response.');
  const amount = row.amount ?? row.total_amount ?? row.total_price ?? row.proposed_total_price;
  return {
    id: String(row.id), title: String(row.tender_title ?? object(row.tender).title ?? `Order #${row.id}`),
    buyer: String(row.buyer_organization ?? row.buyer_name ?? ''), vendor: String(row.vendor_business_name ?? row.vendor_name ?? ''),
    amount: amount != null && Number.isFinite(Number(amount)) ? Number(amount) : null,
    status: String(row.status ?? 'unknown'), escrowStatus: String(row.escrow_status ?? object(row.escrow).status ?? ''),
    tracking: String(row.tracking_reference ?? ''), note: String(row.note ?? ''), createdAt: String(row.created_at ?? ''),
  };
}
export async function listOrders() {
  const { apiClient } = configuredApiClient({ isWorkspaceScoped: false });
  const result = await apiClient<unknown>('GET', '/orders');
  const row = object(result);
  const orders = Array.isArray(result) ? result : row.orders ?? row.items ?? row.data;
  if (!Array.isArray(orders)) throw new Error('Unexpected order list response.');
  return orders.map(parseOrder);
}
export async function getOrder(id: string) {
  const { apiClient } = configuredApiClient({ isWorkspaceScoped: false });
  return parseOrder(await apiClient<unknown>('GET', `/orders/${apiId(id)}`));
}
export async function shipOrder(id: string, note: string, trackingReference: string) {
  const { apiClient } = configuredApiClient({ isWorkspaceScoped: false });
  return apiClient<unknown>('POST', `/orders/${apiId(id)}/ship`, { note, tracking_reference: trackingReference });
}
export async function receiveOrder(id: string, note: string) {
  const { apiClient } = configuredApiClient({ isWorkspaceScoped: false });
  return apiClient<unknown>('POST', `/orders/${apiId(id)}/receive`, { note });
}
