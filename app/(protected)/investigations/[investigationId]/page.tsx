import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CommentThread } from '@/components/investigations/comment-thread';
import { StatusControl } from '@/components/investigations/status-control';
import { PageHeader } from '@/components/layout/page-header';
import { EvidenceList } from '@/components/risk/evidence-list';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { getInvestigation } from '@/lib/api/procureguard';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Investigation' };

interface PageProps {
  params: Promise<{ investigationId: string }>;
}

export default async function InvestigationPage({ params }: PageProps) {
  const { investigationId } = await params;
  const investigation = await getInvestigation(investigationId);
  if (!investigation) notFound();

  return (
    <>
      <PageHeader
        title={`${investigation.code}: ${investigation.title}`}
        description={`${investigation.vendorName} / Opened ${formatDate(investigation.openedAt)}`}
        back={{ href: '/investigations', label: 'All investigations' }}
        actions={
          <ButtonLink
            href={`/tenders/${investigation.tenderId}/vendors/${investigation.vendorId}`}
            variant="secondary"
          >
            View vendor profile
          </ButtonLink>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader title="Issue" />
            <CardBody>
              <p className="text-sm">{investigation.issue}</p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader
              title="Evidence"
              description="Documents and text that raised this issue."
            />
            <CardBody>
              <EvidenceList evidence={investigation.evidence} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Discussion" />
            <CommentThread
              investigationId={investigation.id}
              initialComments={investigation.comments}
            />
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Status" />
            <StatusControl
              investigationId={investigation.id}
              initialStatus={investigation.status}
            />
          </Card>
          <Card>
            <CardHeader title="Assigned to" />
            <CardBody>
              <p className="text-sm font-medium">{investigation.assignee}</p>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
