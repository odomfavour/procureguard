import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DocumentUploader } from '@/components/documents/document-uploader';
import { PageHeader } from '@/components/layout/page-header';
import { FindingsList } from '@/components/risk/findings-list';
import { RiskSummary } from '@/components/risk/risk-summary';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { ComplianceMatrix } from '@/components/vendors/compliance-matrix';
import { DocumentVault } from '@/components/vendors/document-vault';
import { ExtractedFieldsTable } from '@/components/vendors/extracted-fields-table';
import { VerificationPanel } from '@/components/vendors/verification-panel';
import {
  getInvestigations,
  getTender,
  getVendor,
} from '@/lib/api/procureguard';
import { DOCUMENT_LABELS } from '@/lib/constants';
import { formatDate, pluralize } from '@/lib/utils';
import type { DocumentType } from '@/types';

export const metadata: Metadata = { title: 'Vendor risk profile' };

interface PageProps {
  params: Promise<{ tenderId: string; vendorId: string }>;
}

export default async function VendorDetailPage({ params }: PageProps) {
  const { tenderId, vendorId } = await params;
  const [vendor, tender, investigations] = await Promise.all([
    getVendor(vendorId),
    getTender(tenderId),
    getInvestigations(),
  ]);
  if (!vendor || !tender || vendor.tenderId !== tender.id) notFound();

  const investigation = investigations.find((i) => i.vendorId === vendor.id);
  const documentTypes = Object.keys(DOCUMENT_LABELS) as DocumentType[];

  return (
    <>
      <PageHeader
        title={vendor.companyName}
        description={`${vendor.registrationNumber} / Submitted ${formatDate(vendor.submittedAt)} / ${pluralize(vendor.documents.length, 'document')}`}
        back={{ href: `/tenders/${tender.id}`, label: tender.title }}
        actions={
          investigation ? (
            <ButtonLink
              href={`/investigations/${investigation.id}`}
              variant="secondary"
            >
              View {investigation.code}
            </ButtonLink>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <RiskSummary risk={vendor.risk} />

          <Card>
            <CardHeader
              title="Why this score"
              description="Open any finding to see the document text behind it."
            />
            <FindingsList findings={vendor.findings} />
          </Card>

          <Card>
            <CardHeader
              title="Tender compliance"
              description={`${vendor.complianceRate}% of requirements met`}
            />
            <ComplianceMatrix checks={vendor.compliance} />
          </Card>

          <Card>
            <CardHeader
              title="Extracted information"
              description="What the AI read from the submitted documents."
            />
            <ExtractedFieldsTable fields={vendor.extractedFields} />
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader
              title="Vendor verification"
              description={`Verification score ${vendor.verificationScore}/100`}
            />
            <VerificationPanel checks={vendor.verification} />
          </Card>

          <Card>
            <CardHeader title="Document vault" />
            <DocumentVault
              documents={vendor.documents}
              requirements={tender.requirements}
            />
          </Card>

          <Card>
            <CardHeader
              title="Add documents"
              description="New uploads are read and re-checked automatically."
            />
            <DocumentUploader documentTypes={documentTypes} />
          </Card>
        </div>
      </div>
    </>
  );
}
