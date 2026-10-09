import type { Metadata } from 'next';
import { MilestoneTable } from '@/components/billing/milestone-table';
import { PlanCard } from '@/components/billing/plan-card';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader } from '@/components/ui/card';
import { getSession } from '@/lib/api/procureguard';
import { MILESTONE_SPLIT, PLANS } from '@/lib/constants';
import { buildMilestones } from '@/lib/payments';
import { formatNaira } from '@/lib/utils';

export const metadata: Metadata = { title: 'Billing' };

// Demo contract: the accepted ABC Technologies bid.
const DEMO_CONTRACT_VALUE = 74_000_000;

export default async function BillingPage() {
  const session = await getSession();
  const milestones = buildMilestones(DEMO_CONTRACT_VALUE, MILESTONE_SPLIT);

  return (
    <>
      <PageHeader
        title="Billing"
        description="Your ProcureGuard plan and a sample milestone payment schedule."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            current={plan.id === session.workspace.plan}
          />
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader
          title="Milestone payments"
          description={`Contract value ${formatNaira(DEMO_CONTRACT_VALUE, { compact: true })}. Each payment is released after the vendor review is approved.`}
        />
        <MilestoneTable milestones={milestones} />
      </Card>
    </>
  );
}
