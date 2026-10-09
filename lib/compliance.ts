import { DOCUMENT_LABELS } from '@/lib/constants';
import type {
  ComplianceCheck,
  DocumentType,
  TenderRequirements,
  VendorOffer,
} from '@/types';
import { formatNaira } from '@/lib/utils';

export function missingDocuments(
  requirements: TenderRequirements,
  submitted: DocumentType[]
): DocumentType[] {
  return requirements.requiredDocuments.filter(
    (type) => !submitted.includes(type)
  );
}

/** Percentage (0-100) of required documents that were submitted. */
export function documentCompleteness(
  requirements: TenderRequirements,
  submitted: DocumentType[]
) {
  const total = requirements.requiredDocuments.length;
  if (total === 0) return 100;
  return Math.round(
    ((total - missingDocuments(requirements, submitted).length) / total) * 100
  );
}

/** Compare a vendor offer to the tender requirements, one check per requirement. */
export function buildComplianceChecks(
  requirements: TenderRequirements,
  offer: VendorOffer,
  submittedDocuments: DocumentType[]
): ComplianceCheck[] {
  const missing = missingDocuments(requirements, submittedDocuments);

  return [
    {
      id: 'quantity',
      label: 'Quantity',
      required: `${requirements.quantity} units`,
      submitted: `${offer.quantity} units`,
      status: offer.quantity >= requirements.quantity ? 'pass' : 'fail',
    },
    {
      id: 'ram',
      label: 'Memory',
      required: `${requirements.minRamGb}GB RAM or more`,
      submitted: `${offer.ramGb}GB`,
      status: offer.ramGb >= requirements.minRamGb ? 'pass' : 'fail',
    },
    {
      id: 'storage',
      label: 'Storage',
      required: `${requirements.minStorageGb}GB SSD or more`,
      submitted: `${offer.storageGb}GB SSD`,
      status: offer.storageGb >= requirements.minStorageGb ? 'pass' : 'fail',
    },
    {
      id: 'warranty',
      label: 'Warranty',
      required: `${requirements.minWarrantyYears} years or more`,
      submitted: `${offer.warrantyYears} ${offer.warrantyYears === 1 ? 'year' : 'years'}`,
      status:
        offer.warrantyYears >= requirements.minWarrantyYears ? 'pass' : 'fail',
    },
    {
      id: 'delivery',
      label: 'Delivery',
      required: `${requirements.maxDeliveryDays} days or fewer`,
      submitted: `${offer.deliveryDays} days`,
      status:
        offer.deliveryDays <= requirements.maxDeliveryDays ? 'pass' : 'fail',
    },
    {
      id: 'budget',
      label: 'Budget',
      required: `${formatNaira(requirements.maxBudget, { compact: true })} or less`,
      submitted: formatNaira(offer.totalPrice, { compact: true }),
      status: offer.totalPrice <= requirements.maxBudget ? 'pass' : 'fail',
    },
    {
      id: 'documents',
      label: 'Required documents',
      required: `${requirements.requiredDocuments.length} documents`,
      submitted:
        missing.length === 0
          ? 'All provided'
          : `Missing ${missing.map((m) => DOCUMENT_LABELS[m].toLowerCase()).join(', ')}`,
      status: missing.length === 0 ? 'pass' : 'missing',
    },
  ];
}

export function complianceRate(checks: ComplianceCheck[]) {
  if (checks.length === 0) return 0;
  return Math.round(
    (checks.filter((c) => c.status === 'pass').length / checks.length) * 100
  );
}
