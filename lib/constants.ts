import {
  FileSearch,
  LayoutDashboard,
  ReceiptText,
  Scale,
  type LucideIcon,
} from 'lucide-react';
import type {
  DocumentCategory,
  DocumentType,
  DomainEventType,
  InvestigationStatus,
  Plan,
  Role,
  TenderStatus,
} from '@/types';

export const APP_NAME = 'ProcureGuard';

/** Flip to `false` (see .env.example) to call the FastAPI backend. */
export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== 'false';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Tenders', href: '/tenders', icon: Scale },
  { label: 'Investigations', href: '/investigations', icon: FileSearch },
  { label: 'Billing', href: '/billing', icon: ReceiptText },
];

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  company_registration: 'Company registration',
  tax_certificate: 'Tax certificate',
  quotation: 'Quotation',
  proforma_invoice: 'Proforma invoice',
  technical_proposal: 'Technical proposal',
  warranty: 'Warranty',
  bank_details: 'Bank details',
  contract: 'Contract',
};

export const DOCUMENT_CATEGORY: Record<DocumentType, DocumentCategory> = {
  company_registration: 'company',
  tax_certificate: 'compliance',
  quotation: 'financial',
  proforma_invoice: 'financial',
  technical_proposal: 'technical',
  warranty: 'technical',
  bank_details: 'financial',
  contract: 'contracts',
};

export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  company: 'Company',
  compliance: 'Compliance',
  financial: 'Financial',
  technical: 'Technical',
  contracts: 'Contracts',
};

export const TENDER_STATUS_LABELS: Record<TenderStatus, string> = {
  draft: 'Draft',
  open: 'Open for submissions',
  evaluating: 'Evaluating',
  awarded: 'Awarded',
};

export const INVESTIGATION_STATUS_LABELS: Record<InvestigationStatus, string> =
  {
    open: 'Open',
    awaiting_vendor: 'Awaiting vendor',
    resolved: 'Resolved',
    dismissed: 'Dismissed',
  };

export const ROLE_LABELS: Record<Role, string> = {
  platform_admin: 'Platform admin',
  org_admin: 'Organization admin',
  procurement_manager: 'Procurement manager',
  procurement_officer: 'Procurement officer',
  vendor: 'Vendor',
};

export const EVENT_LABELS: Record<DomainEventType, string> = {
  'vendor.created': 'Vendor added',
  'documents.uploaded': 'Documents uploaded',
  'documents.ingested': 'Documents read',
  'analysis.completed': 'Analysis complete',
  'risk.detected': 'Risk detected',
  'investigation.created': 'Investigation opened',
  'vendor.reviewed': 'Vendor reviewed',
  'vendor.approved': 'Vendor approved',
};

export const INGESTION_STAGES = [
  'Uploaded',
  'Reading document',
  'Extracting fields',
  'Cross-checking',
] as const;

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceLabel: '₦50,000 / month',
    features: ['5 active tenders', '20 vendors', '100 documents per month'],
  },
  {
    id: 'business',
    name: 'Business',
    priceLabel: '₦150,000 / month',
    features: ['25 active tenders', '100 vendors', '1,000 documents per month'],
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceLabel: 'Custom',
    features: [
      'Multiple workspaces',
      'Advanced approval policies',
      'Dedicated support',
    ],
  },
];

export const MILESTONE_SPLIT = [20, 40, 40] as const;
