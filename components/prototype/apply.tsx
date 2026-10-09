'use client';
import { PageState, isNotFoundError } from '@/components/ui/page-state';
import Link from 'next/link';
import { useAuth } from '@msflib/react-auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getTender } from '@/lib/api/tenders';
import { applyToTender, listApplications } from '@/lib/api/applications';
import { useToast } from '@/components/ui/toast-provider';
import { Loading } from '@/components/ui/shared';
import FormBuilder from '@/components/msflib/form-builder';
import { field } from '@/components/ui/fields';
import { positiveAmount, futureDate } from '@/lib/schemas/procurement';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { uid, session, notify, money } from '@/lib/prototype';
import { Portal, Panel, Action, Field, Heading } from './portal';
import { useData, btn, select } from './common';
export function Apply() {
  const auth = useAuth();
  const live = auth.status === 'authenticated';
  const toast = useToast();
  const client = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [uploads, setUploads] = useState<Record<string, File>>({});
  const params = useParams();
  const id = String(params.id || params.tenderId);
  const router = useRouter();
  const { db, update } = useData();
  const query = useQuery({ queryKey: ['procureguard', 'tenders', auth.me?.id, id], queryFn: () => getTender(id), enabled: live });
  const applications = useQuery({ queryKey: ['procureguard', 'applications', auth.me?.id, id], queryFn: () => listApplications({ tenderId: id }), enabled: live });
  const t = live ? query.data : db?.tenders.find((x) => x.id === id);
  const account = live ? { id: String(auth.me?.id), organization: '', documents: {} as Record<string, string> } : db?.accounts.find((x) => x.id === session());
  const [error, setError] = useState('');
  const [unitPrices, setUnitPrices] = useState<Record<string, string>>({});
  const [timeline, setTimeline] = useState('');
  const [proposal, setProposal] = useState('');
  const [notes, setNotes] = useState('');
  const [price, setPrice] = useState('');
  const [days, setDays] = useState('');
  const [files, setFiles] = useState<Record<string, string>>({});
  const [responses, setResponses] = useState<Record<string, string>>({});
  if (live && (query.isError || applications.isError)) return <Portal role="vendor"><PageState kind={isNotFoundError(query.error) ? "not-found" : "error"} title={isNotFoundError(query.error) ? "Tender not found" : "Couldn’t load the application form"} onRetry={isNotFoundError(query.error) ? undefined : () => { void query.refetch(); void applications.refetch(); }} backHref="/vendor/tenders" backLabel="Back to tenders" /></Portal>;
  if (!live && db && !t) return <Portal role="vendor"><PageState kind="not-found" title="Tender not found" backHref="/vendor/tenders" backLabel="Back to tenders" /></Portal>;
  if (!t || !account || (live && applications.isPending)) return <Portal role="vendor"><Loading /></Portal>;
  const existing = live ? !!applications.data?.applications.length : db?.applications.some(
    (a) => a.tenderId === id && a.vendorId === account.id
  );
  const quotedTotal = t.items.reduce((sum, item) => sum + item.quantity * (Number(unitPrices[item.id || '']) || 0), 0);
  const invalidQuotes = !t.items.length || t.items.some((item) => !item.id || !Number.isFinite(Number(unitPrices[item.id])) || Number(unitPrices[item.id]) <= 0);
  return (
    <Portal role="vendor">
      <Heading
        title={`Apply: ${t.title}`}
        subtitle="Complete the proposal and attach all required documents."
      />
      <Panel title="Financial proposal">
        {live ? <>
          <div className="mb-5 space-y-4">
            {t.items.map((item, index) => <div key={item.id || index} className="rounded-lg border border-line p-4">
              <p className="font-semibold">{item.name}</p>
              <p className="mb-3 text-sm text-ink-soft">{item.quantity} {item.unit}</p>
              <Field label="Unit price (NGN)" type="number" value={unitPrices[item.id || ''] || ''} onChange={(value) => setUnitPrices((previous) => ({ ...previous, [item.id || '']: value }))} />
              <p className="mt-2 text-sm text-ink-soft">Line total: {money(item.quantity * (Number(unitPrices[item.id || '']) || 0))}</p>
            </div>)}
            <p className="font-semibold">Total quotation: {money(quotedTotal)} · Maximum budget: {money(t.budget)}</p>
            {quotedTotal > t.budget && <p role="alert" className="text-sm text-risk-high">Your quotation exceeds the maximum budget.</p>}
          </div>
          <FormBuilder elements={[field('timeline', 'Delivery timeline (e.g. 14 days)'), field('proposal', 'Proposal', 'textarea'), field('notes', 'Additional notes (optional)', 'textarea', false)]}
            formData={{ timeline, proposal, notes }}
            setFormData={(change: React.SetStateAction<Record<string, unknown>>) => {
              const next = typeof change === 'function' ? change({ timeline, proposal, notes }) : change;
              setTimeline(String(next.timeline ?? '')); setProposal(String(next.proposal ?? '')); setNotes(String(next.notes ?? ''));
            }} onSubmit={() => {}} />
        </> : <FormBuilder
          elements={[
            field('price', 'Total proposed price (NGN)', 'number'),
            field('days', 'Delivery / completion days', 'number'),
          ]}
          formData={{ price, days }}
          setFormData={(
            change: React.SetStateAction<Record<string, unknown>>
          ) => {
            const next =
              typeof change === 'function' ? change({ price, days }) : change;
            setPrice(String(next.price || ''));
            setDays(String(next.days || ''));
          }}
          onSubmit={() => {}}
        />}
      </Panel>
      <div className="h-5" />
      <Panel title="Tender requirements">
        {t.requirements.map((r) => (
          <div key={r.id} className="mb-4">
            <p className="mb-2 text-sm text-ink-soft">
              {r.label} — Expected: {r.value}
            </p>
            <Field
              label="Your response"
              value={responses[r.id] || ''}
              onChange={(v) => setResponses((p) => ({ ...p, [r.id]: v }))}
            />
          </div>
        ))}
        {!t.requirements.length && (
          <p className="text-sm text-ink-soft">No custom requirements.</p>
        )}
      </Panel>
      <div className="h-5" />
      <Panel
        title="Required documents"
        subtitle={live ? "Attach the required files to your proposal." : "Select a document from your vault or enter a demo filename. No real files are uploaded."}
      >
        <div className="space-y-4">
          {t.documents.map((d) => (
            <div key={d} className="rounded-lg border border-line p-3">
              <p className="mb-2 text-sm font-semibold">{d} *</p>
              {live ? <input type="file" accept="application/pdf,image/png,image/jpeg" aria-label={`Upload ${d}`} className={select} onChange={(event) => {
                const file = event.target.files?.[0];
                if (file && !['application/pdf', 'image/png', 'image/jpeg'].includes(file.type)) {
                  toast('Upload a PDF, PNG, or JPEG file.', 'error');
                  event.target.value = '';
                  return;
                }
                setFiles((previous) => ({ ...previous, [d]: file?.name || '' }));
                setUploads((previous) => { const next = { ...previous }; if (file) next[d] = file; else delete next[d]; return next; });
              }} /> : <div className="grid gap-2 sm:grid-cols-2">
                <select
                  className={select}
                  value={files[d] || ''}
                  onChange={(e) =>
                    setFiles((p) => ({ ...p, [d]: e.target.value }))
                  }
                >
                  <option value="">Choose existing document</option>
                  {Object.entries(account.documents)
                    .filter(([k, v]) => v && k === d)
                    .map(([k, v]) => (
                      <option key={k} value={v}>
                        {v} (vault)
                      </option>
                    ))}
                </select>
                <input
                  className={select}
                  placeholder="Or document filename.pdf"
                  value={files[d] || ''}
                  onChange={(e) =>
                    setFiles((p) => ({ ...p, [d]: e.target.value }))
                  }
                />
              </div>}
            </div>
          ))}
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm text-risk-high">
            {error}
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <Link className={btn} href={`/vendor/tenders/${id}`}>
            Cancel
          </Link>
          <Action
            disabled={
              submitting || existing ||
              t.status !== 'open' ||
              (live ? invalidQuotes || quotedTotal > t.budget || !timeline.trim() || !proposal.trim() : Number(price) <= 0 || Number(days) <= 0) ||
              t.documents.some((d) => !files[d]) ||
              t.requirements.some((r) => !responses[r.id])
            }
            onClick={async () => {
              if (submitting) return;
              try {
                if (!live) { positiveAmount(price); positiveAmount(days); }
                futureDate(t.deadline);
                setError('');
                if (live) {
                  setSubmitting(true);
                  if (invalidQuotes || quotedTotal > t.budget || !timeline.trim() || !proposal.trim()) throw new Error('Complete every item quote, delivery timeline, and proposal within the tender budget.');
                  await applyToTender(id, {
                    item_quotes: t.items.map((item) => ({ tender_item_id: Number(item.id), unit_price: positiveAmount(unitPrices[item.id!]) })),
                    requirement_responses: t.requirements.map((requirement) => ({ requirement_id: Number(requirement.id), response: responses[requirement.id]?.trim() || '' })),
                    delivery_timeline: timeline.trim(),
                    proposal: proposal.trim(),
                    additional_notes: notes.trim(),
                  }, uploads);
                  await client.invalidateQueries({ queryKey: ['procureguard', 'applications'] });
                  toast('Application submitted successfully.');
                  router.push('/vendor/applications');
                  return;
                }
                update((d) => {
                  if (
                    d.applications.some(
                      (x) => x.tenderId === id && x.vendorId === account.id
                    )
                  )
                    throw new Error('Already applied.');
                  d.applications.push({
                    id: uid(),
                    tenderId: id,
                    vendorId: account.id,
                    price: Number(price),
                    deliveryDays: Number(days),
                    documents: files,
                    responses,
                    status: 'submitted',
                  });
                  notify(
                    d,
                    t.buyerId,
                    `${account.organization} applied for ${t.title}`
                  );
                });
                router.push('/vendor/applications');
              } catch (e) {
                const message = e instanceof Error ? e.message : 'Could not save application.';
                setError(message);
                toast(message, 'error');
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting ? 'Submitting…' : existing ? 'Already applied' : 'Submit application'}
          </Action>
        </div>
      </Panel>
    </Portal>
  );
}
