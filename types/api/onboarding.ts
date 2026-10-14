export type OnboardingDetails = {
  organization_name?: string;
  business_name?: string;
  location?: string;
  categories?: string[];
  onboarded?: boolean;
  onboarding_completed?: boolean;
  account_type?: 'buyer' | 'vendor';
};
