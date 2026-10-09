'use client';
import { configuredApiClient } from '@msflib/core';
import { apiId } from './tenders';

export type ApplicationRecord = {
  id: string; tenderId: string; title: string; status: string;
  price: number | null; deliveryDays: number | null;
  responses: Record<string, string>;
  documents: { id: string; name: string; filename: string }[];
};
function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
export function parseApplication(value: unknown): ApplicationRecord {
  const row = object(value);
  if (row.id == null || row.tender_id == null) throw new Error('Invalid application response.');
  let rawData = row.application_data;
  if (typeof rawData === 'string') {
    try { rawData = JSON.parse(rawData); } catch { throw new Error('Invalid application data returned by the server.'); }
  }
  const data = { ...row, ...object(rawData) };
  const number = (value: unknown) => value == null || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);
  const documents = Array.isArray(row.documents) ? row.documents.map((value, index) => {
    const document = object(value);
    return { id: String(document.id ?? index), name: String(document.name ?? document.document_name ?? 'Document'), filename: typeof value === 'string' ? value : String(document.filename ?? document.file_name ?? document.url ?? '') };
  }) : Object.entries(object(row.documents)).map(([name, value]) => ({ id: name, name, filename: String(value) }));
  return {
    id: String(row.id), tenderId: String(row.tender_id),
    title: String(row.tender_title ?? object(row.tender).title ?? `Tender #${row.tender_id}`),
    status: String(row.status ?? 'submitted'),
    price: number(data.price ?? data.proposed_price), deliveryDays: number(data.delivery_days ?? data.deliveryDays),
    responses: Object.fromEntries(Object.entries(object(data.responses)).map(([key, value]) => [key, String(value)])),
    documents,
  };
}
export async function applyToTender(id: string, data: { price: number; delivery_days: number; responses: Record<string, string> }, documents: Record<string, File>) {
  const body = new FormData();
  body.append('application_data', JSON.stringify(data));
  Object.entries(documents).forEach(([name, file]) => {
    body.append('document_names', name);
    body.append('documents', file);
  });
  const { apiFormDataClient } = configuredApiClient({ isWorkspaceScoped: false });
  return apiFormDataClient<unknown>('POST', `/tenders/${apiId(id)}/apply`, body);
}
export async function listApplications({ tenderId, status, offset = 0, limit = 20 }: { tenderId?: string; status?: string; offset?: number; limit?: number } = {}) {
  if (!Number.isInteger(offset) || offset < 0 || !Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('Invalid application pagination.');
  const query: Record<string, string | number> = { offset, limit };
  if (tenderId) query.tender_id = apiId(tenderId);
  if (status) query.status = status;
  const { apiClient } = configuredApiClient({ isWorkspaceScoped: false });
  const response = await apiClient<unknown>('GET', '/applications/my-applications', undefined, { query });
  const envelope = object(response);
  const rows = Array.isArray(response) ? response : envelope.applications ?? envelope.items ?? envelope.results ?? envelope.data;
  if (!Array.isArray(rows)) throw new Error('Unexpected application list response.');
  return { applications: rows.map(parseApplication), total: typeof envelope.total === 'number' ? envelope.total : undefined };
}
export async function getApplication(id: string) {
  const { apiClient } = configuredApiClient({ isWorkspaceScoped: false });
  return parseApplication(await apiClient<unknown>('GET', `/applications/${apiId(id)}`));
}


export async function listAllApplications(options: { tenderId?: string; status?: string } = {}) {
  const applications: ApplicationRecord[] = [];
  for (let offset = 0; ; offset += 100) {
    const page = await listApplications({ ...options, offset, limit: 100 });
    applications.push(...page.applications);
    if (page.applications.length < 100 || (page.total !== undefined && applications.length >= page.total)) break;
  }
  return { applications, total: applications.length };
}
