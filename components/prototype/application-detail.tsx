'use client';
import { PageState } from '@/components/ui/page-state';
import Link from 'next/link';
import { useAuth } from '@msflib/react-auth';
import { LiveApplicationDetail } from './live-applications';
import { DataTable } from '@/components/msflib/data-table';
import { Assessment } from './assessment';
import { useParams } from 'next/navigation';
import { analyze, money } from '@/lib/prototype';
import { Portal, Panel, Heading } from './portal';
import { useData, btn } from './common';
export function ApplicationDetail() {
  const auth = useAuth();
  const { id } = useParams<{ id: string }>();
  const { db, update } = useData();
  const a = db?.applications.find((x) => x.id === id);
  const t = db?.tenders.find((x) => x.id === a?.tenderId);
  const vendor = db?.accounts.find((x) => x.id === a?.vendorId);
  if (auth.status === 'authenticated') return <LiveApplicationDetail id={id} role="buyer" />;
  if (db && (!a || !t)) return <Portal role="buyer"><PageState kind="not-found" title="Application not found" backHref="/tenders" backLabel="Back to tenders" /></Portal>;
  if (!a || !t) return null;
  return (
    <Portal role="buyer">
      <Heading
        title={vendor?.organization || 'Vendor submission'}
        subtitle={`${t.title} · Bid ${money(a.price)}`}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Submission">
          <p className="mb-3 text-sm">
            Delivery timeline: {a.deliveryDays} days
          </p>
          <DataTable
            title="Requirement responses"
            rows={Object.entries(a.responses).map(([id, response]) => ({
              id,
              requirement: t.requirements.find((r) => r.id === id)?.label || id,
              response,
            }))}
            columns={[
              {
                field: 'requirement',
                headerName: 'Requirement',
                minWidth: 180,
                flex: 1,
              },
              {
                field: 'response',
                headerName: 'Vendor response',
                minWidth: 220,
                flex: 2,
              },
            ]}
          />
          <div className="mt-5">
            <DataTable
              title="Submitted documents"
              rows={Object.entries(a.documents).map(([type, name]) => ({
                id: type,
                type,
                name,
              }))}
              columns={[
                {
                  field: 'type',
                  headerName: 'Document type',
                  minWidth: 180,
                  flex: 1,
                },
                {
                  field: 'name',
                  headerName: 'Filename',
                  minWidth: 220,
                  flex: 2,
                },
              ]}
            />
          </div>
        </Panel>
        <Panel
          title="ProcureGuard AI assessment"
          subtitle="Analysis runs only when you trigger it."
        >
          <Assessment
            application={a}
            tender={t}
            onAnalyze={() =>
              update((d) => {
                const x = d.applications.find((x) => x.id === id);
                if (x) x.analysis = analyze(x, t);
              })
            }
          />
        </Panel>
      </div>
      <Link className={`${btn} mt-5`} href={`/tenders/${t.id}/compare`}>
        Compare applicants →
      </Link>
    </Portal>
  );
}
