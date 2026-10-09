'use client';
import { PageState, isNotFoundError } from '@/components/ui/page-state';

import Link from 'next/link';
import { useAuth } from '@msflib/react-auth';
import { useQuery } from '@tanstack/react-query';
import { getTender } from '@/lib/api/tenders';
import { Loading } from '@/components/ui/shared';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Package,
  FileText,
  Clock3,
  Scale,
} from 'lucide-react';

import { analyze, money } from '@/lib/prototype';
import { Portal, Action } from './portal';
import { useData, btn } from './common';

type TenderRole = 'buyer' | 'vendor';

type DetailItemProps = {
  label: string;
  value: React.ReactNode;
};

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-xs text-ink-soft">{label}</p>
      <div className="break-words text-sm font-medium text-ink">{value}</div>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
        </div>
        {action}
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  const styles =
    normalized === 'open' || normalized === 'approved'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : normalized === 'closed' || normalized === 'rejected'
        ? 'border-red-200 bg-red-50 text-red-700'
        : 'border-blue-200 bg-blue-50 text-blue-700';

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium capitalize ${styles}`}
    >
      {status}
    </span>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const normalized = risk.toLowerCase();

  const isLow = normalized === 'low';
  const isHigh = normalized === 'high';

  const styles = isLow
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : isHigh
      ? 'bg-red-50 text-red-700 border-red-200'
      : 'bg-amber-50 text-amber-700 border-amber-200';

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${styles}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {risk} risk
    </span>
  );
}

function ScoreIndicator({ score }: { score: number }) {
  const safeScore = Math.max(0, Math.min(100, score));

  const color =
    safeScore >= 80 ? '#059669' : safeScore >= 60 ? '#d97706' : '#dc2626';

  return (
    <div
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full p-1"
      style={{
        background: `conic-gradient(${color} ${safeScore}%, #e5e7eb 0)`,
      }}
      aria-label={`Evaluation score: ${safeScore} out of 100`}
    >
      <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-sm font-bold text-ink">
        {safeScore}
      </div>
    </div>
  );
}

export function TenderDetail({ role }: { role: TenderRole }) {
  const auth = useAuth();
  const live = auth.status === 'authenticated';
  const { db, update } = useData();
  const params = useParams();

  const id = String(params.id || params.tenderId);

  const query = useQuery({ queryKey: ['procureguard', 'tenders', auth.me?.id, id], queryFn: () => getTender(id), enabled: live });
  const tender = live ? query.data : db?.tenders.find((item) => item.id === id);

  const applications =
    live ? [] : db?.applications.filter((item) => item.tenderId === id) ?? [];

  if (live && query.isError) return <Portal role={role}><PageState kind={isNotFoundError(query.error) ? "not-found" : "error"} title={isNotFoundError(query.error) ? "Tender not found" : "Couldn’t load this tender"} onRetry={isNotFoundError(query.error) ? undefined : () => void query.refetch()} backHref={role === "buyer" ? "/tenders" : "/vendor/tenders"} backLabel="Back to tenders" /></Portal>;
  if (!live && db && !tender) return <Portal role={role}><PageState kind="not-found" title="Tender not found" backHref={role === "buyer" ? "/tenders" : "/vendor/tenders"} backLabel="Back to tenders" /></Portal>;
  if (!db || !tender) {
    return <Portal role={role}><Loading /></Portal>;
  }

  const isBuyer = role === 'buyer';

  const rankedApplications = applications
    .map((application) => {
      const vendor = db.accounts.find(
        (account) => account.id === application.vendorId
      );

      return {
        ...application,
        vendorName: vendor?.organization || 'Unknown vendor',
      };
    })
    .sort((a, b) => (b.analysis?.score ?? -1) - (a.analysis?.score ?? -1));

  const analyzedApplications = rankedApplications.filter(
    (application) => application.analysis
  );

  const lowestBid =
    applications.length > 0
      ? Math.min(...applications.map((application) => application.price))
      : null;

  const bestEvaluated = analyzedApplications[0];

  const cheapestApplication =
    lowestBid === null
      ? undefined
      : rankedApplications.find(
          (application) => application.price === lowestBid
        );

  return (
    <Portal role={role}>
      <div className="space-y-6 pb-10">
        {/* Page heading */}
        <div>
          <Link
            href={isBuyer ? '/tenders' : '/vendor/tenders'}
            className="mb-4 inline-flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-brand"
          >
            <ArrowLeft className="h-4 w-4" />
            All tenders
          </Link>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="max-w-3xl">
              <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                {tender.title}
              </h1>

              <p className="mt-3 text-sm leading-6 text-ink-soft sm:text-base">
                {tender.description}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <StatusBadge status={tender.status} />

                <span className="inline-flex items-center gap-1.5 text-sm text-ink-soft">
                  <CalendarDays className="h-4 w-4" />
                  Closes {tender.deadline}
                </span>

                <span className="text-sm text-ink-soft">
                  {tender.category} · {tender.type}
                </span>
              </div>
            </div>

            {!isBuyer && tender.status === 'open' && (
              <Link
                className={`${btn} inline-flex items-center gap-2`}
                href={`/vendor/tenders/${id}/apply`}
              >
                Apply for tender
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Evaluation insight — buyer only */}
        {isBuyer &&
          bestEvaluated &&
          cheapestApplication &&
          bestEvaluated.id !== cheapestApplication.id && (
            <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 sm:p-5">
              <Scale className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

              <div>
                <h3 className="text-sm font-semibold text-blue-900">
                  Price is not the only signal
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {cheapestApplication.vendorName} submitted a bid of{' '}
                  {money(cheapestApplication.price)}, compared with{' '}
                  {money(bestEvaluated.price)} from the highest-scoring vendor,{' '}
                  {bestEvaluated.vendorName}.
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Evaluation scores support procurement decisions. The
                  procurement team makes the final decision.
                </p>
              </div>
            </div>
          )}

        {/* Applications */}
        {isBuyer && !live && (
          <SectionCard
            title={`Vendor comparison (${applications.length})`}
            subtitle="Vendors are ranked by their evaluation score, not by price."
            action={
              applications.length > 0 ? (
                <Link
                  href={`/tenders/${id}/compare`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                >
                  Full comparison
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : undefined
            }
          >
            {rankedApplications.length === 0 ? (
              <div className="py-10 text-center">
                <Package className="mx-auto h-9 w-9 text-ink-soft" />

                <h3 className="mt-3 text-sm font-semibold">
                  No applications yet
                </h3>

                <p className="mt-1 text-sm text-ink-soft">
                  Published tenders are visible to vendors.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {rankedApplications.map((application, index) => {
                  const analysis = application.analysis;

                  return (
                    <div
                      key={application.id}
                      className="rounded-xl border border-line p-4 transition-colors hover:bg-paper/50"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        {/* Vendor */}
                        <div className="flex min-w-0 items-center gap-3 lg:w-[25%]">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-paper text-xs font-semibold text-ink-soft">
                            {index + 1}
                          </span>

                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold text-ink">
                              {application.vendorName}
                            </h3>

                            <p className="mt-1 text-xs capitalize text-ink-soft">
                              {application.status}
                            </p>
                          </div>
                        </div>

                        {/* Score and risk */}
                        <div className="flex items-center gap-4">
                          {analysis ? (
                            <>
                              <ScoreIndicator score={analysis.score} />
                              <RiskBadge risk={analysis.risk} />
                            </>
                          ) : (
                            <span className="inline-flex items-center gap-2 text-sm text-ink-soft">
                              <Clock3 className="h-4 w-4" />
                              Not analyzed
                            </span>
                          )}
                        </div>

                        {/* Price */}
                        <div className="min-w-[120px]">
                          <p className="text-xs text-ink-soft">Bid price</p>

                          <p className="mt-1 text-base font-semibold text-ink">
                            {money(application.price)}
                          </p>

                          {lowestBid !== null && (
                            <p className="mt-1 text-xs text-ink-soft">
                              {application.price === lowestBid
                                ? 'Lowest bid'
                                : `${Math.round(
                                    ((application.price - lowestBid) /
                                      (lowestBid || 1)) *
                                      100
                                  )}% above lowest bid`}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/applications/${application.id}`}
                            className={`${btn} inline-flex items-center gap-2`}
                          >
                            View submission
                          </Link>

                          {!analysis && (
                            <Action
                              onClick={() =>
                                update((data) => {
                                  const app = data.applications.find(
                                    (item) => item.id === application.id
                                  );

                                  if (app) {
                                    app.analysis = analyze(app, tender);
                                  }
                                })
                              }
                            >
                              Analyze
                            </Action>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        )}

        {/* Tender requirements */}
        <SectionCard title="Tender requirements">
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem label="Maximum budget" value={money(tender.budget)} />

            <DetailItem label="Submission deadline" value={tender.deadline} />

            <DetailItem
              label="Delivery / service location"
              value={tender.location || 'Not specified'}
            />

            <DetailItem label="Procurement type" value={tender.type} />

            <DetailItem label="Category" value={tender.category} />

            <DetailItem
              label="Status"
              value={<StatusBadge status={tender.status} />}
            />
          </div>

          {/* Custom requirements */}
          {tender.requirements.length > 0 && (
            <div className="mt-6 border-t border-line pt-5">
              <h3 className="mb-4 text-sm font-semibold text-ink">
                Technical and custom requirements
              </h3>

              <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                {tender.requirements.map((requirement) => (
                  <DetailItem
                    key={requirement.id}
                    label={requirement.label}
                    value={requirement.value || 'Not specified'}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Required documents */}
          <div className="mt-6 border-t border-line pt-5">
            <h3 className="mb-3 text-sm font-semibold text-ink">
              Required documents
            </h3>

            {tender.documents.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tender.documents.map((document) => (
                  <span
                    key={document}
                    className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink-soft"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {document}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-soft">No documents required.</p>
            )}
          </div>
        </SectionCard>

        {/* Items / deliverables */}
        <SectionCard
          title="Items / deliverables"
          subtitle="Goods, services or works requested for this tender."
        >
          {tender.items.length === 0 ? (
            <p className="text-sm text-ink-soft">No deliverables specified.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tender.items.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="flex items-start gap-3 rounded-xl border border-line bg-paper/40 p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <Package className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-ink">
                      {item.name}
                    </h3>

                    <p className="mt-1 text-xs text-ink-soft">
                      {item.quantity} {item.unit}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </Portal>
  );
}
