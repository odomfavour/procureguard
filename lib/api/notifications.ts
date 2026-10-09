'use client';
import { configuredApiClient } from '@msflib/core';
import { apiId } from './tenders';
export type AccountNotification = {
  id: string; notificationId: string; title: string; message: string; read: boolean;
  createdAt: string; type: string; channels: string[];
};
export function parseNotification(value: unknown): AccountNotification {
  if (!value || typeof value !== 'object' || !('id' in value)) throw new Error('Invalid notification response.');
  const row = value as Record<string, unknown>;
  const notification = row.notification as Record<string, unknown> | undefined;
  if (!notification || typeof notification !== 'object') throw new Error('Missing notification details.');
  return { id: String(row.id), notificationId: String(row.notification_id), title: String(notification.title ?? ''), message: String(notification.message ?? ''), read: row.is_read === true, createdAt: String(row.created_at ?? notification.created_at ?? ''), type: String(notification.notification_type ?? ''), channels: Array.isArray(notification.channels) ? notification.channels.map(String) : [] };
}
export async function listNotifications() {
  const { apiClient } = configuredApiClient({ isWorkspaceScoped: false });
  const rows: AccountNotification[] = [];
  for (let offset = 0; ; offset += 100) {
    const page = await apiClient<unknown>('GET', '/notifications/', undefined, { query: { offset, limit: 100 } });
    if (!Array.isArray(page)) throw new Error('Unexpected notification list response.');
    rows.push(...page.map(parseNotification));
    if (page.length < 100) break;
  }
  return rows;
}
export async function getNotification(id: string) {
  const { apiClient } = configuredApiClient({ isWorkspaceScoped: false });
  return parseNotification(await apiClient('GET', `/notifications/${apiId(id)}`));
}
export async function markNotification(id: string, read: boolean) {
  const { apiClient } = configuredApiClient({ isWorkspaceScoped: false });
  return apiClient('PATCH', `/notifications/${apiId(id)}/mark`, undefined, { query: { status: read } });
}
export async function markAllNotifications(read: boolean) {
  const { apiClient } = configuredApiClient({ isWorkspaceScoped: false });
  return apiClient('PATCH', '/notifications/mark-all', undefined, { query: { status: read } });
}
export async function deleteNotification(id: string) {
  const { apiClient } = configuredApiClient({ isWorkspaceScoped: false });
  return apiClient('DELETE', `/notifications/${apiId(id)}`);
}
