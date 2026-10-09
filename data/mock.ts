import { DOCUMENT_CATEGORY, DOCUMENT_LABELS } from '@/lib/constants';
import {
  buildComplianceChecks,
  complianceRate,
  documentCompleteness,
} from '@/lib/compliance';
import {
  recommendationFor,
  riskLevelFromScore,
  verificationScore,
} from '@/lib/risk';
import { formatNaira } from '@/lib/utils';
import type {
  DocumentType,
  DomainEvent,
  Evidence,
  ExtractedField,
  Finding,
  Investigation,
  Session,
  Tender,
  TenderRequirements,
  Vendor,
  VendorDocument,
  VendorOffer,
  VerificationCheck,
} from '@/types';

/* -------------------------------------------------------------------------- */
/*  Demo dataset: fictional vendors for a 100-laptop tender                   */
/*  Vendor A  clean submission          Vendor C  best overall                */
/*  Vendor B  cheap but risky           Vendor D  inconsistent                */
/* -------------------------------------------------------------------------- */

export const session: Session = {
  user: {
    id: 'u-1',
    name: 'Chiamaka Eze',
    email: 'chiamaka@northwind.ng',
    role: 'procurement_manager',
    workspaceId: 'ws-1',
  },
  workspace: { id: 'ws-1', name: 'Northwind Logistics', plan: 'business' },
};

const REQUIREMENTS: TenderRequirements = {
  quantity: 100,
  maxBudget: 80_000_000,
  minRamGb: 16,
  minStorageGb: 512,
  minWarrantyYears: 3,
  maxDeliveryDays: 14,
  requiredDocuments: [
    'company_registration',
    'tax_certificate',
    'quotation',
    'technical_proposal',
    'warranty',
    'bank_details',
  ],
};

export const tenders: Tender[] = [
  {
    id: 'tender-001',
    title: '100 business laptops',
    description:
      'Supply and delivery of 100 business laptops for the Lagos and Abuja offices, with on-site warranty support.',
    status: 'evaluating',
    createdAt: '2026-09-18T08:00:00Z',
    deadline: '2026-10-12T17:00:00Z',
    requirements: REQUIREMENTS,
    vendorCount: 4,
  },
  {
    id: 'tender-002',
    title: 'Branch office laptops, phase 2',
    description: 'Second batch of laptops for the new regional branches.',
    status: 'draft',
    createdAt: '2026-10-05T10:30:00Z',
    deadline: '2026-11-05T17:00:00Z',
    requirements: { ...REQUIREMENTS, quantity: 40, maxBudget: 32_000_000 },
    vendorCount: 0,
  },
];

/* ---- builders ------------------------------------------------------------ */

const ALL_REQUIRED: DocumentType[] = REQUIREMENTS.requiredDocuments;

function makeDocuments(
  vendorId: string,
  types: DocumentType[],
  uploadedAt: string
): VendorDocument[] {
  return types.map((type) => ({
    id: `${vendorId}-${type}`,
    type,
    name: `${DOCUMENT_LABELS[type]}.pdf`,
    category: DOCUMENT_CATEGORY[type],
    uploadedAt,
    status: 'ingested',
  }));
}

function ev(
  vendorId: string,
  type: DocumentType,
  excerpt: string,
  field?: string
): Evidence {
  return {
    documentId: `${vendorId}-${type}`,
    documentName: `${DOCUMENT_LABELS[type]}.pdf`,
    field,
    excerpt,
  };
}

const CONFIDENCE = [0.99, 0.98, 0.99, 0.97, 0.96, 0.95, 0.97, 0.93, 0.96];

function makeExtractedFields(
  vendorId: string,
  companyName: string,
  registrationNumber: string,
  offer: VendorOffer,
  docTypes: DocumentType[]
): ExtractedField[] {
  const pick = (...candidates: DocumentType[]) =>
    candidates.find((c) => docTypes.includes(c)) ?? 'quotation';

  const rows: [string, string, DocumentType][] = [
    ['Company name', companyName, pick('company_registration')],
    ['Registration number', registrationNumber, pick('company_registration')],
    ['Total price', formatNaira(offer.totalPrice), 'quotation'],
    ['Quantity', `${offer.quantity} units`, 'quotation'],
    ['Unit price', formatNaira(offer.unitPrice), 'quotation'],
    ['Memory', `${offer.ramGb}GB`, pick('technical_proposal')],
    ['Storage', `${offer.storageGb}GB SSD`, pick('technical_proposal')],
    [
      'Warranty',
      `${offer.warrantyYears} ${offer.warrantyYears === 1 ? 'year' : 'years'}`,
      pick('warranty', 'technical_proposal'),
    ],
    ['Delivery', `${offer.deliveryDays} days`, 'quotation'],
  ];

  return rows.map(([label, value, type], i) => ({
    label,
    value,
    documentId: `${vendorId}-${type}`,
    documentName: `${DOCUMENT_LABELS[type]}.pdf`,
    confidence: CONFIDENCE[i],
  }));
}

interface VendorSeed {
  id: string;
  companyName: string;
  registrationNumber: string;
  submittedAt: string;
  offer: VendorOffer;
  docTypes: DocumentType[];
  verification: VerificationCheck[];
  scores: {
    overall: number;
    identity: number;
    documentConsistency: number;
    financialConsistency: number;
  };
  findings: Omit<Finding, 'vendorId'>[];
}

function buildVendor(seed: VendorSeed): Vendor {
  const compliance = buildComplianceChecks(
    REQUIREMENTS,
    seed.offer,
    seed.docTypes
  );
  const level = riskLevelFromScore(seed.scores.overall);

  return {
    id: seed.id,
    tenderId: 'tender-001',
    companyName: seed.companyName,
    registrationNumber: seed.registrationNumber,
    submittedAt: seed.submittedAt,
    offer: seed.offer,
    documents: makeDocuments(seed.id, seed.docTypes, seed.submittedAt),
    extractedFields: makeExtractedFields(
      seed.id,
      seed.companyName,
      seed.registrationNumber,
      seed.offer,
      seed.docTypes
    ),
    verification: seed.verification,
    verificationScore: verificationScore(seed.verification),
    compliance,
    complianceRate: complianceRate(compliance),
    risk: {
      overall: seed.scores.overall,
      level,
      breakdown: {
        identity: seed.scores.identity,
        documentConsistency: seed.scores.documentConsistency,
        tenderCompliance: complianceRate(compliance),
        financialConsistency: seed.scores.financialConsistency,
        requiredDocuments: documentCompleteness(REQUIREMENTS, seed.docTypes),
      },
      recommendation: recommendationFor(level),
    },
    findings: seed.findings.map((f) => ({ ...f, vendorId: seed.id })),
  };
}

/* ---- vendors ------------------------------------------------------------- */

const vendorA = buildVendor({
  id: 'vendor-a',
  companyName: 'ABC Technologies Ltd',
  registrationNumber: 'RC123456',
  submittedAt: '2026-09-30T09:15:00Z',
  offer: {
    quantity: 100,
    unitPrice: 740_000,
    totalPrice: 74_000_000,
    ramGb: 16,
    storageGb: 512,
    warrantyYears: 3,
    deliveryDays: 12,
  },
  docTypes: [...ALL_REQUIRED, 'proforma_invoice'],
  verification: [
    { id: 'identity', label: 'Company identity', status: 'verified' },
    {
      id: 'registration',
      label: 'Registration information',
      status: 'verified',
    },
    { id: 'tax', label: 'Tax information', status: 'verified' },
    { id: 'bank', label: 'Bank information', status: 'verified' },
    { id: 'certificates', label: 'Required certificates', status: 'verified' },
    {
      id: 'consistency',
      label: 'Document consistency',
      status: 'warning',
      note: 'Company name is written two ways across documents.',
    },
  ],
  scores: {
    overall: 92,
    identity: 98,
    documentConsistency: 96,
    financialConsistency: 91,
  },
  findings: [
    {
      id: 'f-a1',
      title: 'Minor company-name variation',
      description:
        'The registered name and the quotation spell the company suffix differently. The registration number matches in both.',
      severity: 'info',
      category: 'identity',
      evidence: [
        ev(
          'vendor-a',
          'company_registration',
          'ABC Technologies Limited, RC123456',
          'Company name'
        ),
        ev(
          'vendor-a',
          'quotation',
          'ABC Technologies Ltd, RC123456',
          'Company name'
        ),
      ],
    },
  ],
});

const vendorB = buildVendor({
  id: 'vendor-b',
  companyName: 'XYZ Supplies Ltd',
  registrationNumber: 'RC884201',
  submittedAt: '2026-10-01T14:40:00Z',
  offer: {
    quantity: 100,
    unitPrice: 510_000,
    totalPrice: 51_000_000,
    ramGb: 8,
    storageGb: 512,
    warrantyYears: 1,
    deliveryDays: 21,
  },
  docTypes: [
    'company_registration',
    'quotation',
    'technical_proposal',
    'bank_details',
  ],
  verification: [
    { id: 'identity', label: 'Company identity', status: 'verified' },
    {
      id: 'registration',
      label: 'Registration information',
      status: 'verified',
    },
    {
      id: 'tax',
      label: 'Tax information',
      status: 'failed',
      note: 'No tax certificate was submitted.',
    },
    {
      id: 'bank',
      label: 'Bank information',
      status: 'warning',
      note: 'Account holder differs from the registered company.',
    },
    {
      id: 'certificates',
      label: 'Required certificates',
      status: 'failed',
      note: 'Warranty document was not submitted.',
    },
    { id: 'consistency', label: 'Document consistency', status: 'verified' },
  ],
  scores: {
    overall: 57,
    identity: 55,
    documentConsistency: 70,
    financialConsistency: 48,
  },
  findings: [
    {
      id: 'f-b1',
      title: 'Bank account entity mismatch',
      description:
        'The bank account is held by a different entity from the registered company. This needs human verification before any payment is approved.',
      severity: 'critical',
      category: 'identity',
      evidence: [
        ev(
          'vendor-b',
          'company_registration',
          'XYZ Supplies Ltd, RC884201',
          'Company name'
        ),
        ev(
          'vendor-b',
          'bank_details',
          'Account name: John Doe Enterprises',
          'Account name'
        ),
      ],
    },
    {
      id: 'f-b2',
      title: 'Tax certificate missing',
      description:
        'A tax certificate is a mandatory document for this tender and was not part of the submission.',
      severity: 'critical',
      category: 'documents',
      evidence: [],
    },
    {
      id: 'f-b3',
      title: 'Warranty below requirement',
      description:
        'The technical proposal offers 1 year of warranty. The tender requires at least 3 years.',
      severity: 'warning',
      category: 'compliance',
      evidence: [
        ev(
          'vendor-b',
          'technical_proposal',
          'Warranty: 12 months parts and labour',
          'Warranty'
        ),
      ],
    },
    {
      id: 'f-b4',
      title: 'Memory below requirement',
      description:
        'The proposed laptops have 8GB of RAM. The tender requires at least 16GB.',
      severity: 'warning',
      category: 'compliance',
      evidence: [
        ev('vendor-b', 'technical_proposal', 'Memory: 8GB DDR4', 'Memory'),
      ],
    },
    {
      id: 'f-b5',
      title: 'Delivery later than allowed',
      description:
        'Delivery is quoted at 21 days. The tender allows 14 days at most.',
      severity: 'warning',
      category: 'compliance',
      evidence: [
        ev(
          'vendor-b',
          'quotation',
          'Delivery within 21 working days of order',
          'Delivery'
        ),
      ],
    },
    {
      id: 'f-b6',
      title: 'Price is 33% below the other bids',
      description:
        'A bid this far below the others can signal a misunderstanding of the scope or a cost that appears later. Worth confirming with the vendor.',
      severity: 'warning',
      category: 'financial',
      evidence: [
        ev(
          'vendor-b',
          'quotation',
          'Total: ₦51,000,000 for 100 units',
          'Total price'
        ),
      ],
    },
  ],
});

const vendorC = buildVendor({
  id: 'vendor-c',
  companyName: 'Lagos Prime Computing Ltd',
  registrationNumber: 'RC1029377',
  submittedAt: '2026-10-01T10:05:00Z',
  offer: {
    quantity: 100,
    unitPrice: 790_000,
    totalPrice: 79_000_000,
    ramGb: 16,
    storageGb: 512,
    warrantyYears: 4,
    deliveryDays: 10,
  },
  docTypes: ALL_REQUIRED,
  verification: [
    { id: 'identity', label: 'Company identity', status: 'verified' },
    {
      id: 'registration',
      label: 'Registration information',
      status: 'verified',
    },
    { id: 'tax', label: 'Tax information', status: 'verified' },
    { id: 'bank', label: 'Bank information', status: 'verified' },
    { id: 'certificates', label: 'Required certificates', status: 'verified' },
    { id: 'consistency', label: 'Document consistency', status: 'verified' },
  ],
  scores: {
    overall: 89,
    identity: 95,
    documentConsistency: 93,
    financialConsistency: 80,
  },
  findings: [
    {
      id: 'f-c1',
      title: 'Bid is ₦5M above the lowest compliant bid',
      description:
        'The price is within budget. The extra cost buys a 4-year warranty and faster delivery than the lowest compliant bid.',
      severity: 'info',
      category: 'financial',
      evidence: [
        ev(
          'vendor-c',
          'quotation',
          'Total: ₦79,000,000 for 100 units',
          'Total price'
        ),
      ],
    },
  ],
});

const vendorD = buildVendor({
  id: 'vendor-d',
  companyName: 'Nexus Office Solutions Ltd',
  registrationNumber: 'RC7731904',
  submittedAt: '2026-10-02T16:20:00Z',
  offer: {
    quantity: 100,
    unitPrice: 760_000,
    totalPrice: 76_000_000,
    ramGb: 16,
    storageGb: 256,
    warrantyYears: 2,
    deliveryDays: 14,
  },
  docTypes: [
    'company_registration',
    'quotation',
    'proforma_invoice',
    'technical_proposal',
    'bank_details',
  ],
  verification: [
    {
      id: 'identity',
      label: 'Company identity',
      status: 'warning',
      note: 'Company name differs between documents.',
    },
    {
      id: 'registration',
      label: 'Registration information',
      status: 'verified',
    },
    {
      id: 'tax',
      label: 'Tax information',
      status: 'failed',
      note: 'No tax certificate was submitted.',
    },
    { id: 'bank', label: 'Bank information', status: 'verified' },
    {
      id: 'certificates',
      label: 'Required certificates',
      status: 'failed',
      note: 'Warranty document was not submitted.',
    },
    {
      id: 'consistency',
      label: 'Document consistency',
      status: 'failed',
      note: 'Prices and quantities conflict between documents.',
    },
  ],
  scores: {
    overall: 48,
    identity: 60,
    documentConsistency: 30,
    financialConsistency: 40,
  },
  findings: [
    {
      id: 'f-d1',
      title: 'Quotation and proforma invoice show different prices',
      description:
        'The same quantity is priced differently across the two documents, a difference of ₦5,000,000.',
      severity: 'critical',
      category: 'consistency',
      evidence: [
        ev('vendor-d', 'quotation', 'Total: ₦76,000,000', 'Total price'),
        ev('vendor-d', 'proforma_invoice', 'Total: ₦81,000,000', 'Total price'),
      ],
    },
    {
      id: 'f-d2',
      title: 'Quantities do not match',
      description:
        'The quotation covers 100 units but the proforma invoice bills for 90.',
      severity: 'critical',
      category: 'consistency',
      evidence: [
        ev('vendor-d', 'quotation', 'Quantity: 100 units', 'Quantity'),
        ev('vendor-d', 'proforma_invoice', 'Quantity: 90 units', 'Quantity'),
      ],
    },
    {
      id: 'f-d3',
      title: 'Company name written differently across documents',
      description:
        'The registration and the quotation do not use the same company name.',
      severity: 'warning',
      category: 'identity',
      evidence: [
        ev(
          'vendor-d',
          'company_registration',
          'Nexus Office Solutions Limited',
          'Company name'
        ),
        ev(
          'vendor-d',
          'quotation',
          'Nexus Office Solution Ltd',
          'Company name'
        ),
      ],
    },
    {
      id: 'f-d4',
      title: 'Storage below requirement',
      description:
        'The proposed laptops have 256GB of storage. The tender requires at least 512GB.',
      severity: 'warning',
      category: 'compliance',
      evidence: [
        ev('vendor-d', 'technical_proposal', 'Storage: 256GB SSD', 'Storage'),
      ],
    },
    {
      id: 'f-d5',
      title: 'Tax certificate and warranty documents missing',
      description: 'Two mandatory documents were not part of the submission.',
      severity: 'critical',
      category: 'documents',
      evidence: [],
    },
  ],
});

export const vendors: Vendor[] = [vendorA, vendorB, vendorC, vendorD];

/* ---- investigations ------------------------------------------------------ */

export const investigations: Investigation[] = [
  {
    id: 'inv-0012',
    code: 'INV-0012',
    tenderId: 'tender-001',
    vendorId: 'vendor-b',
    vendorName: vendorB.companyName,
    title: 'Bank account entity mismatch',
    issue:
      'The bank account on file is held by John Doe Enterprises, not XYZ Supplies Ltd. Confirm the relationship with the vendor before any payment is approved.',
    status: 'open',
    assignee: 'Procurement Manager',
    openedAt: '2026-10-02T11:20:00Z',
    evidence: [
      ev(
        'vendor-b',
        'company_registration',
        'XYZ Supplies Ltd, RC884201',
        'Company name'
      ),
      ev(
        'vendor-b',
        'bank_details',
        'Account name: John Doe Enterprises',
        'Account name'
      ),
      ev(
        'vendor-b',
        'quotation',
        'Please remit payment to the account in the attached bank details',
        'Payment terms'
      ),
    ],
    comments: [
      {
        id: 'c-1',
        authorName: 'Tunde Bakare',
        authorRole: 'procurement_officer',
        body: 'Flagged after ingestion. The account holder is a different entity from the registered company.',
        createdAt: '2026-10-02T11:25:00Z',
      },
      {
        id: 'c-2',
        authorName: 'Chiamaka Eze',
        authorRole: 'procurement_manager',
        body: "I'll ask the vendor for a letter explaining the relationship, plus a bank confirmation letter.",
        createdAt: '2026-10-02T13:02:00Z',
      },
    ],
  },
  {
    id: 'inv-0013',
    code: 'INV-0013',
    tenderId: 'tender-001',
    vendorId: 'vendor-d',
    vendorName: vendorD.companyName,
    title: 'Price and quantity conflict between documents',
    issue:
      'The quotation and proforma invoice disagree on both price and quantity. Ask the vendor which document reflects their real offer.',
    status: 'awaiting_vendor',
    assignee: 'Procurement Officer',
    openedAt: '2026-10-03T09:10:00Z',
    evidence: [
      ev(
        'vendor-d',
        'quotation',
        'Total: ₦76,000,000, Quantity: 100 units',
        'Total price'
      ),
      ev(
        'vendor-d',
        'proforma_invoice',
        'Total: ₦81,000,000, Quantity: 90 units',
        'Total price'
      ),
    ],
    comments: [
      {
        id: 'c-3',
        authorName: 'Tunde Bakare',
        authorRole: 'procurement_officer',
        body: 'Clarification request sent to the vendor. Waiting for a reply.',
        createdAt: '2026-10-03T09:30:00Z',
      },
    ],
  },
];

/* ---- activity ------------------------------------------------------------ */

export const events: DomainEvent[] = [
  {
    id: 'e-1',
    type: 'risk.detected',
    message: 'Bank account entity mismatch found for XYZ Supplies Ltd',
    at: '2026-10-02T11:18:00Z',
  },
  {
    id: 'e-2',
    type: 'investigation.created',
    message: 'INV-0012 opened for XYZ Supplies Ltd',
    at: '2026-10-02T11:20:00Z',
  },
  {
    id: 'e-3',
    type: 'analysis.completed',
    message: 'Nexus Office Solutions Ltd analysed against 100 business laptops',
    at: '2026-10-02T16:41:00Z',
  },
  {
    id: 'e-4',
    type: 'risk.detected',
    message: 'Conflicting prices found for Nexus Office Solutions Ltd',
    at: '2026-10-03T09:05:00Z',
  },
  {
    id: 'e-5',
    type: 'investigation.created',
    message: 'INV-0013 opened for Nexus Office Solutions Ltd',
    at: '2026-10-03T09:10:00Z',
  },
  {
    id: 'e-6',
    type: 'vendor.reviewed',
    message: 'Lagos Prime Computing Ltd reviewed by Chiamaka Eze',
    at: '2026-10-05T15:30:00Z',
  },
];
