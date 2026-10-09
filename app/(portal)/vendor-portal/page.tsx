import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Check, Circle } from 'lucide-react';
import { DocumentUploader } from '@/components/documents/document-uploader';
import { PageHeader } from '@/components/layout/page-header';
import { RequirementsSummary } from '@/components/tenders/requirements-summary';
import { Card, CardHeader } from '@/components/ui/card';
import { getTender, getVendor } from '@/lib/api/procureguard';
import { DOCUMENT_LABELS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Vendor portal' };

// Demo: the portal shows the submission of one fictional vendor.
const DEMO_VENDOR_ID = 'vendor-b';

export default async function VendorPortalPage() {
  const vendor = await getVendor(DEMO_VENDOR_ID);
  if (!vendor) notFound();
  const tender = await getTender(vendor.tenderId);
  if (!tender) notFound();

  const submitted = new Set(vendor.documents.map((d) => d.type));
  const required = tender.requirements.requiredDocuments;
  const outstanding = required.filter((type) => !submitted.has(type));

  return (
    <>
      <PageHeader
        title={tender.title}
        description={`Responding as ${vendor.companyName}. Submissions close ${formatDate(tender.deadline)}.`}
      />

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader
            title="Your submission"
            description={
              outstanding.length === 0
                ? 'All required documents are in.'
                : `${outstanding.length} required ${outstanding.length === 1 ? 'document is' : 'documents are'} still missing.`
            }
          />
          <ul className="divide-y divide-line">
            {required.map((type) => {
              const done = submitted.has(type);
              return (
                <li
                  key={type}
                  className="flex items-center gap-3 px-5 py-3 text-sm"
                >
                  {done ? (
                    <Check className="size-4 text-risk-low" aria-hidden />
                  ) : (
                    <Circle className="size-4 text-ink-soft" aria-hidden />
                  )}
                  <span className={cn('flex-1', !done && 'font-medium')}>
                    {DOCUMENT_LABELS[type]}
                  </span>
                  <span
                    className={cn(
                      'text-xs',
                      done ? 'text-risk-low' : 'text-risk-high'
                    )}
                  >
                    {done ? 'Received' : 'Needed'}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Upload documents" />
          <DocumentUploader
            documentTypes={outstanding.length > 0 ? outstanding : required}
          />
        </Card>

        <Card>
          <CardHeader title="What the buyer is asking for" />
          <RequirementsSummary requirements={tender.requirements} />
        </Card>
      </div>
    </>
  );
}
