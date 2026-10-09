'use client';
import { configuredApiClient } from '@msflib/core';
import { apiId } from './tenders';

export type ApplicationRecord = {
  id: string; tenderId: string; title: string; status: string;
  price: number | null; deliveryDays: number | null;
  deliveryTimeline: string; proposal: string; additionalNotes: string;
  vendorName: string; category: string; procurementType: string; maximumBudget: number | null;
  deadline: string; location: string; submittedAt: string;
  itemQuotes: { id: string; item: string; quantity: number | null; unit: string; unitPrice: number | null; totalPrice: number | null }[];
  requirementResponses: { id: string; requirement: string; requiredValue: string; response: string }[];
  responses: Record<string, string>;
  documents: { id: string; name: string; filename: string; url: string | null; format: string; sizeBytes: number | null }[];
};
function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
export function parseApplication(value: unknown): ApplicationRecord {
  const envelope = object(value);
  const row = envelope.application ? object(envelope.application) : envelope;
  if (row.id == null || row.tender_id == null) throw new Error('Invalid application response.');
  let rawData = row.application_data;
  if (typeof rawData === 'string') {
    try { rawData = JSON.parse(rawData); } catch { throw new Error('Invalid application data returned by the server.'); }
  }
  const data = { ...row, ...object(rawData) };
  const number = (value: unknown) => value == null || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);
  const documents = Array.isArray(row.documents) ? row.documents.map((value, index) => {
    const document = object(value);
    const format = String(document.file_format ?? '');
    let url: string | null = null;
    try {
      const parsed = new URL(String(document.url ?? ''));
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') url = parsed.href;
    } catch { /* References without a valid HTTP URL remain plain text. */ }
    const name = String(document.name ?? document.document_name ?? 'Document');
    return { id: String(document.id ?? index), name, filename: typeof value === 'string' ? value : String(document.filename ?? document.file_name ?? (format ? `${name}.${format}` : name)), url, format, sizeBytes: number(document.size_bytes) };
  }) : Object.entries(object(row.documents)).map(([name, value]) => ({ id: name, name, filename: String(value), url: null, format: '', sizeBytes: null }));
  const requirementResponses = Array.isArray(data.requirement_responses) ? data.requirement_responses.map((entry) => {
    const response = object(entry);
    return { id: String(response.requirement_id), requirement: String(response.requirement_name ?? response.requirement_id), requiredValue: String(response.required_value ?? ''), response: String(response.vendor_response ?? response.response ?? '') };
  }) : Object.entries(object(data.responses)).map(([id, value]) => ({ id, requirement: id, requiredValue: '', response: String(value) }));

  return {
    id: String(row.id), tenderId: String(row.tender_id),
    title: String(row.tender_title ?? object(row.tender).title ?? `Tender #${row.tender_id}`),
    status: String(row.status ?? 'submitted'),
    vendorName: String(row.vendor_business_name ?? ''), category: String(row.tender_category ?? ''),
    procurementType: String(row.procurement_type ?? ''), maximumBudget: number(row.maximum_budget),
    deadline: String(row.submission_deadline ?? ''), location: String(row.delivery_location ?? ''), submittedAt: String(row.submitted_at ?? ''),
    itemQuotes: Array.isArray(data.item_quotes) ? data.item_quotes.map((entry) => { const quote = object(entry); return { id: String(quote.tender_item_id), item: String(quote.item ?? ''), quantity: number(quote.quantity), unit: String(quote.unit ?? ''), unitPrice: number(quote.unit_price), totalPrice: number(quote.total_price) }; }) : [],
    price: number(data.proposed_total_price ?? data.price ?? data.proposed_price), deliveryDays: number(data.delivery_days ?? data.deliveryDays),
    deliveryTimeline: String(data.delivery_timeline ?? ''), proposal: String(data.proposal ?? ''), additionalNotes: String(data.additional_notes ?? ''),
    requirementResponses,
    responses: Object.fromEntries(requirementResponses.map((response) => [response.id, response.response])),
    documents,
  };
}
export type TenderApplicationPayload = {
  item_quotes: { tender_item_id: number; unit_price: number }[];
  requirement_responses: { requirement_id: number; response: string }[];
  delivery_timeline: string;
  proposal: string;
  additional_notes: string;
};

export async function applyToTender(id: string, data: TenderApplicationPayload, documents: Record<string, File>) {
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

export async function listTenderApplications(id: string) {
  const { apiClient } = configuredApiClient({ isWorkspaceScoped: false });
  const response = await apiClient<unknown>('GET', `/applications/for-tender/${apiId(id)}`);
  const row = object(response);
  const applications = Array.isArray(response) ? response : row.applications ?? row.items ?? row.data;
  if (!Array.isArray(applications)) throw new Error('Unexpected tender applications response.');
  return applications.map((value) => parseApplication({ tender_id: Number(id), ...object(value) }));
}
