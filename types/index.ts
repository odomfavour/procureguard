/* -------------------------------------------------------------------------- */
/*  ProcureGuard domain types                                                 */
/*  Every shape that crosses a component, service or API boundary lives here. */
/* -------------------------------------------------------------------------- */

/* ---- Identity, workspaces & roles --------------------------------------- */

export type Role =
  | 'platform_admin'
  | 'org_admin'
  | 'procurement_manager'
  | 'procurement_officer'
  | 'vendor';

export type PlanId = 'starter' | 'business' | 'enterprise';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  workspaceId: string;
}

export interface Workspace {
  id: string;
  name: string;
  plan: PlanId;
}

/* ---- Tenders ------------------------------------------------------------- */

export type TenderStatus = 'draft' | 'open' | 'evaluating' | 'awarded';

export type DocumentType =
  | 'company_registration'
  | 'tax_certificate'
  | 'quotation'
  | 'proforma_invoice'
  | 'technical_proposal'
  | 'warranty'
  | 'bank_details'
  | 'contract';

export type DocumentCategory =
  'company' | 'compliance' | 'financial' | 'technical' | 'contracts';

export interface TenderRequirements {
  quantity: number;
  maxBudget: number;
  minRamGb: number;
  minStorageGb: number;
  minWarrantyYears: number;
  maxDeliveryDays: number;
  requiredDocuments: DocumentType[];
}

export interface Tender {
  id: string;
  title: string;
  description: string;
  status: TenderStatus;
  createdAt: string;
  deadline: string;
  requirements: TenderRequirements;
  vendorCount: number;
}

export interface CreateTenderInput {
  title: string;
  description: string;
  deadline: string;
  requirements: TenderRequirements;
}

/* ---- Vendor submissions -------------------------------------------------- */

export type IngestionStatus = 'uploaded' | 'ingesting' | 'ingested' | 'failed';

export interface VendorDocument {
  id: string;
  type: DocumentType;
  name: string;
  category: DocumentCategory;
  uploadedAt: string;
  status: IngestionStatus;
}

export interface VendorOffer {
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  ramGb: number;
  storageGb: number;
  warrantyYears: number;
  deliveryDays: number;
}

export interface ExtractedField {
  label: string;
  value: string;
  documentId: string;
  documentName: string;
  /** 0 - 1 extraction confidence */
  confidence: number;
}

/* ---- Compliance & verification ------------------------------------------ */

export type ComplianceStatus = 'pass' | 'fail' | 'missing';

export interface ComplianceCheck {
  id: string;
  label: string;
  required: string;
  submitted: string;
  status: ComplianceStatus;
}

export type CheckStatus = 'verified' | 'warning' | 'failed';

export interface VerificationCheck {
  id: string;
  label: string;
  status: CheckStatus;
  note?: string;
}

/* ---- Risk & findings ----------------------------------------------------- */

export type RiskLevel = 'low' | 'medium' | 'high';

export type FindingSeverity = 'critical' | 'warning' | 'info';

export type FindingCategory =
  'identity' | 'consistency' | 'compliance' | 'financial' | 'documents';

export interface Evidence {
  documentId: string;
  documentName: string;
  field?: string;
  excerpt: string;
}

export interface Finding {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  severity: FindingSeverity;
  category: FindingCategory;
  evidence: Evidence[];
}

export interface RiskBreakdown {
  identity: number;
  documentConsistency: number;
  tenderCompliance: number;
  financialConsistency: number;
  requiredDocuments: number;
}

export interface RiskAssessment {
  overall: number;
  level: RiskLevel;
  breakdown: RiskBreakdown;
  recommendation: string;
}

export interface Vendor {
  id: string;
  tenderId: string;
  companyName: string;
  registrationNumber: string;
  submittedAt: string;
  offer: VendorOffer;
  documents: VendorDocument[];
  extractedFields: ExtractedField[];
  verification: VerificationCheck[];
  verificationScore: number;
  compliance: ComplianceCheck[];
  complianceRate: number;
  risk: RiskAssessment;
  findings: Finding[];
}

/* ---- Investigations ------------------------------------------------------ */

export type InvestigationStatus =
  'open' | 'awaiting_vendor' | 'resolved' | 'dismissed';

export interface Comment {
  id: string;
  authorName: string;
  authorRole: Role;
  body: string;
  createdAt: string;
}

export interface Investigation {
  id: string;
  code: string;
  tenderId: string;
  vendorId: string;
  vendorName: string;
  title: string;
  issue: string;
  status: InvestigationStatus;
  assignee: string;
  openedAt: string;
  evidence: Evidence[];
  comments: Comment[];
}

/* ---- Events, dashboard & billing ---------------------------------------- */

export type DomainEventType =
  | 'vendor.created'
  | 'documents.uploaded'
  | 'documents.ingested'
  | 'analysis.completed'
  | 'risk.detected'
  | 'investigation.created'
  | 'vendor.reviewed'
  | 'vendor.approved';

export interface DomainEvent {
  id: string;
  type: DomainEventType;
  message: string;
  at: string;
}

export interface DashboardStats {
  activeTenders: number;
  vendorsUnderReview: number;
  highRiskVendors: number;
  openInvestigations: number;
}

export interface Plan {
  id: PlanId;
  name: string;
  priceLabel: string;
  features: string[];
  highlighted?: boolean;
}

export interface Milestone {
  id: string;
  label: string;
  percent: number;
  amount: number;
}

export interface AttentionItem {
  finding: Finding;
  vendorName: string;
  tenderId: string;
}

export interface Session {
  user: User;
  workspace: Workspace;
}
