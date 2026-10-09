'use client';

import { configuredApiClient } from '@msflib/core';

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
