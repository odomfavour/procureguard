'use client';

import { configuredApiClient } from '@msflib/core';

export type OnboardingDetails = {
  organization_name?: string;
  business_name?: string;
  location?: string;
  categories?: string[];
  onboarded?: boolean;
  onboarding_completed?: boolean;
  account_type?: 'buyer' | 'vendor';
};

export function hasCompletedOnboarding(details: OnboardingDetails | null | undefined) {
  if (!details) return false;
  if (typeof details.onboarded === 'boolean') return details.onboarded;
  if (typeof details.onboarding_completed === 'boolean') return details.onboarding_completed;
  return !!((details.organization_name || details.business_name)?.trim() && details.location?.trim());
}

export async function getPostLoginPath(fallback: 'buyer' | 'vendor' = 'buyer') {
  const role = await getOnboardingRole(fallback);
  const details = await getMyOnboarding();
  const resolvedRole = details?.account_type || (details?.business_name ? 'vendor' : details?.organization_name ? 'buyer' : role);
  return hasCompletedOnboarding(details)
    ? resolvedRole === 'vendor' ? '/vendor/dashboard' : '/dashboard'
    : `/onboarding/${resolvedRole}?account=live`;
}

export async function getOnboardingRole(fallback: 'buyer' | 'vendor' = 'buyer') {
  const { apiClient } = configuredApiClient({ isWorkspaceScoped: false });
  const account = await apiClient<{ account_type?: string; role?: string; data?: { account_type?: string } }>('GET', '/account/me');
  const role = account.account_type || account.data?.account_type || account.role;
  return role === 'vendor' || role === 'buyer' ? role : fallback;
}

export async function getMyOnboarding(): Promise<OnboardingDetails | null> {
  const { apiClient } = configuredApiClient({ isWorkspaceScoped: false });
  let result: unknown;
  try {
    result = await apiClient<unknown>('GET', '/onboarding/me');
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error && error.status === 404) return null;
    throw error;
  }
  // The backend currently declares an unrestricted response schema.
  return result && typeof result === 'object' && !Array.isArray(result)
    ? result as OnboardingDetails
    : null;
}

export async function onboardBuyer(organizationName: string, location: string) {
  const { apiClient } = configuredApiClient({ isWorkspaceScoped: false });
  return apiClient<unknown>('POST', '/onboarding/buyer', {
    organization_name: organizationName,
    location,
  });
}

export async function onboardVendor(input: {
  businessName: string;
  location: string;
  categories: string[];
  documents: Record<string, File>;
  gallery: File[];
}) {
  const body = new FormData();
  body.append('business_name', input.businessName);
  body.append('location', input.location);
  input.categories.forEach((category) => body.append('categories', category));
  Object.entries(input.documents).forEach(([name, file]) => {
    body.append('document_names', name);
    body.append('documents', file);
  });
  input.gallery.forEach((file) => body.append('gallery', file));
  const { apiFormDataClient } = configuredApiClient({ isWorkspaceScoped: false });
  return apiFormDataClient<unknown>('POST', '/onboarding/vendor', body);
}
