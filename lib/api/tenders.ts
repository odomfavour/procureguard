'use client';

import { configuredApiClient } from '@msflib/core';

export type TenderSummary = {
  id: string;
  title: string;
  category: string;
  type: string;
  location: string;
  budget: number;
  deadline: string;
  status: string;
};

export type TenderPage = { tenders: TenderSummary[]; total?: number };

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}

export function parseTenderPage(response: unknown): TenderPage {
  const envelope = record(response);
  const rows = Array.isArray(response) ? response : envelope?.tenders ?? envelope?.items ?? envelope?.results ?? envelope?.data;
  if (!Array.isArray(rows)) throw new Error('Unexpected tender list response. Please retry.');
  const tenders = rows.map((value) => {
    const row = record(value);
    if (!row || row.id == null || typeof row.title !== 'string') throw new Error('Invalid tender record returned by the server.');
    const budget = Number(row.maximum_budget ?? row.budget);
    if (!Number.isFinite(budget)) throw new Error('Invalid tender budget returned by the server.');
    return {
      id: String(row.id), title: row.title,
      category: String(row.category ?? ''),
      type: String(row.procurement_type ?? row.type ?? ''),
      location: String(row.delivery_location ?? row.location ?? ''),
      budget,
      deadline: String(row.submission_deadline ?? row.deadline ?? ''),
      status: String(row.status ?? 'active'),
    };
  });
  const total = envelope?.total ?? envelope?.count;
  return { tenders, total: typeof total === 'number' ? total : undefined };
}

export async function listTenders({ role, status, offset = 0, limit = 20 }: {
  role: 'buyer' | 'vendor'; status?: 'active' | 'closed'; offset?: number; limit?: number;
}): Promise<TenderPage> {
  if (!Number.isInteger(offset) || offset < 0 || !Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('Invalid tender pagination.');
  const query: Record<string, string | number> = { offset, limit };
  if (role === 'buyer' && status) query.status = status;
  const { apiClient } = configuredApiClient({ isWorkspaceScoped: false });
  const response = await apiClient<unknown>('GET', role === 'buyer' ? '/tenders/my-tenders' : '/tenders/active', undefined, { query });
  return parseTenderPage(response);
}

export type CreateTenderPayload = {
  title: string;
  category: string;
  procurement_type: string;
  maximum_budget: number;
  submission_deadline: string;
  delivery_location: string;
  optional_description: string;
  items: { item: string; quantity: number; unit: string }[];
  product_requirements: { requirement_name: string; value: string }[];
  required_documents: { name: string; description: string }[];
  optional_notes: string;
};

export async function createTender(payload: CreateTenderPayload) {
  const { apiClient } = configuredApiClient({ isWorkspaceScoped: false });
  return apiClient<unknown>('POST', '/tenders', payload);
}
