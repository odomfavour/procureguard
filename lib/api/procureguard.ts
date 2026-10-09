'use server';
import { demo as mock } from '@/lib/demo/reference-store';
import { revalidatePath } from 'next/cache';
import {
  requiredText,
  positiveAmount,
  futureDate,
} from '@/lib/schemas/procurement';
import { USE_MOCKS } from '@/lib/constants';
import { apiFetch } from '@/lib/api/client';
import type {
  AttentionItem,
  Comment,
  CreateTenderInput,
  DashboardStats,
  DomainEvent,
  Investigation,
  InvestigationStatus,
  Session,
  Tender,
  Vendor,
} from '@/types';

/* -------------------------------------------------------------------------- */
/*  Service layer. Components only ever call these functions.                 */
/*  With NEXT_PUBLIC_USE_MOCKS=false each one hits the FastAPI backend.       */
/* -------------------------------------------------------------------------- */

export async function getSession(): Promise<Session> {
  if (USE_MOCKS) return mock.session;
  return apiFetch<Session>('/session');
}

export async function getDashboardStats(): Promise<DashboardStats> {
  if (USE_MOCKS) {
    return {
      activeTenders: mock.tenders.filter((t) => t.status !== 'awarded').length,
      vendorsUnderReview: mock.vendors.length,
      highRiskVendors: mock.vendors.filter((v) => v.risk.level === 'high')
        .length,
      openInvestigations: mock.investigations.filter(
        (i) => i.status === 'open' || i.status === 'awaiting_vendor'
      ).length,
    };
  }
  return apiFetch<DashboardStats>('/dashboard/stats');
}

export async function getRecentEvents(): Promise<DomainEvent[]> {
  if (USE_MOCKS) return [...mock.events].reverse();
  return apiFetch<DomainEvent[]>('/dashboard/events');
}

export async function getAttentionItems(): Promise<AttentionItem[]> {
  if (USE_MOCKS) {
    return mock.vendors.flatMap((vendor) =>
      vendor.findings
        .filter((f) => f.severity === 'critical')
        .map((finding) => ({
          finding,
          vendorName: vendor.companyName,
          tenderId: vendor.tenderId,
        }))
    );
  }
  return apiFetch<AttentionItem[]>('/dashboard/attention');
}

export async function getTenders(): Promise<Tender[]> {
  if (USE_MOCKS) return mock.tenders;
  return apiFetch<Tender[]>('/tenders');
}

export async function getTender(id: string): Promise<Tender | null> {
  if (USE_MOCKS) return mock.tenders.find((t) => t.id === id) ?? null;
  return apiFetch<Tender | null>(`/tenders/${id}`);
}

export async function createTender(input: CreateTenderInput): Promise<Tender> {
  if (USE_MOCKS) {
    requiredText(input.title, 'Title');
    requiredText(input.description, 'Description');
    futureDate(input.deadline);
    for (const value of [
      input.requirements.quantity,
      input.requirements.maxBudget,
      input.requirements.maxDeliveryDays,
      input.requirements.minRamGb,
      input.requirements.minStorageGb,
      input.requirements.minWarrantyYears,
    ])
      positiveAmount(value);
    if (!input.requirements.requiredDocuments.length)
      throw new Error('Select required documents.');
    const tender: Tender = {
      ...input,
      id: crypto.randomUUID(),
      status: 'open',
      createdAt: new Date().toISOString(),
      vendorCount: 0,
    };
    mock.tenders.push(tender);
    revalidatePath('/tenders');
    revalidatePath('/dashboard');
    return tender;
  }
  return apiFetch<Tender>('/tenders', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getVendors(tenderId: string): Promise<Vendor[]> {
  if (USE_MOCKS) return mock.vendors.filter((v) => v.tenderId === tenderId);
  return apiFetch<Vendor[]>(`/tenders/${tenderId}/vendors`);
}

export async function getVendor(id: string): Promise<Vendor | null> {
  if (USE_MOCKS) return mock.vendors.find((v) => v.id === id) ?? null;
  return apiFetch<Vendor | null>(`/vendors/${id}`);
}

export async function getInvestigations(): Promise<Investigation[]> {
  if (USE_MOCKS) return mock.investigations;
  return apiFetch<Investigation[]>('/investigations');
}

export async function getInvestigation(
  id: string
): Promise<Investigation | null> {
  if (USE_MOCKS) return mock.investigations.find((i) => i.id === id) ?? null;
  return apiFetch<Investigation | null>(`/investigations/${id}`);
}

export async function addComment(
  investigationId: string,
  body: string
): Promise<Comment> {
  if (USE_MOCKS) {
    const investigation = mock.investigations.find(
      (i) => i.id === investigationId
    );
    if (!investigation) throw new Error('Investigation not found.');
    const comment: Comment = {
      id: crypto.randomUUID(),
      authorName: mock.session.user.name,
      authorRole: mock.session.user.role,
      body: requiredText(body, 'Comment'),
      createdAt: new Date().toISOString(),
    };
    investigation.comments.push(comment);
    revalidatePath(`/investigations/${investigationId}`);
    return comment;
  }
  return apiFetch<Comment>(`/investigations/${investigationId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

export async function updateInvestigationStatus(
  investigationId: string,
  status: InvestigationStatus
): Promise<InvestigationStatus> {
  if (USE_MOCKS) {
    if (!['open', 'awaiting_vendor', 'resolved', 'dismissed'].includes(status))
      throw new Error('Invalid status.');
    const investigation = mock.investigations.find(
      (i) => i.id === investigationId
    );
    if (!investigation) throw new Error('Investigation not found.');
    investigation.status = status;
    revalidatePath('/investigations');
    revalidatePath('/dashboard');
    return status;
  }
  await apiFetch(`/investigations/${investigationId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return status;
}
