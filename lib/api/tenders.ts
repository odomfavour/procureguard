'use client';

import { configuredApiClient } from '@msflib/core';
import type { Tender } from '@/lib/prototype';

export function apiId(id: string) {
  if (!/^\d+$/.test(id)) throw new Error('Invalid record ID.');
  return id;
}

export async function getTender(id: string): Promise<Tender> {
  const { apiClient } = configuredApiClient({ isWorkspaceScoped: false });
  const response = await apiClient<unknown>('GET', `/tenders/${apiId(id)}`);
  const envelope = record(response);
  const row = record(envelope?.tender) ?? envelope;
  if (!row) throw new Error('Unexpected tender detail response.');
  const summary = parseTenderPage([row]).tenders[0];
  const objects = (value: unknown) => Array.isArray(value) ? value.map(record).filter((entry): entry is Record<string, unknown> => !!entry) : [];
  return {
    ...summary,
    status: (summary.status === 'active' ? 'open' : summary.status) as Tender['status'],
    buyerId: String(row.buyer_id ?? ''),
    description: String(row.optional_description ?? row.description ?? ''),
    items: objects(row.items).map((entry) => ({ id: entry.id == null ? undefined : String(entry.id), name: String(entry.item ?? entry.name ?? ''), quantity: Number(entry.quantity), unit: String(entry.unit ?? '') })),
    requirements: objects(row.product_requirements ?? row.requirements).map((entry, index) => ({ id: String(entry.id ?? index), label: String(entry.requirement_name ?? entry.label ?? ''), value: String(entry.value ?? '') })),
    documents: Array.isArray(row.required_documents ?? row.documents) ? ((row.required_documents ?? row.documents) as unknown[]).map((entry) => typeof entry === 'string' ? entry : String(record(entry)?.name ?? '')).filter(Boolean) : [],
  };
}

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


export async function listAllTenders(options: { role: 'buyer' | 'vendor'; status?: 'active' | 'closed' }) {
  const tenders: TenderSummary[] = [];
  for (let offset = 0; ; offset += 100) {
    const page = await listTenders({ ...options, offset, limit: 100 });
    tenders.push(...page.tenders);
    if (page.tenders.length < 100 || (page.total !== undefined && tenders.length >= page.total)) break;
  }
  return { tenders, total: tenders.length };
}
