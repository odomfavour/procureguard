import type { Metadata } from 'next';
import { InvestigationCard } from '@/components/investigations/investigation-card';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { getInvestigations } from '@/lib/api/procureguard';

export const metadata: Metadata = { title: 'Investigations' };

export default async function InvestigationsPage() {
  const investigations = await getInvestigations();
  return (
    <>
      <PageHeader
        title="Investigations"
        description="Issues your team is following up on before approving a vendor."
      />
      {investigations.length === 0 ? (
        <Card>
          <EmptyState
            title="No investigations"
            description="Open one from a vendor finding when something needs a closer look."
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {investigations.map((investigation) => (
            <InvestigationCard
              key={investigation.id}
              investigation={investigation}
            />
          ))}
        </div>
      )}
    </>
  );
}
