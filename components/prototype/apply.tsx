'use client';
import Link from 'next/link';
import FormBuilder from '@/components/msflib/form-builder';
import { field } from '@/components/ui/fields';
import { positiveAmount, futureDate } from '@/lib/schemas/procurement';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { uid, session, notify } from '@/lib/prototype';
import { Portal, Panel, Action, Field, Heading } from './portal';
import { useData, btn, select } from './common';
export function Apply() {
  const params = useParams();
  const id = String(params.id || params.tenderId);
  const router = useRouter();
  const { db, update } = useData();
  const t = db?.tenders.find((x) => x.id === id);
  const account = db?.accounts.find((x) => x.id === session());
  const [error, setError] = useState('');
  const [price, setPrice] = useState('');
  const [days, setDays] = useState('');
  const [files, setFiles] = useState<Record<string, string>>({});
  const [responses, setResponses] = useState<Record<string, string>>({});
  if (!t || !account) return null;
  const existing = db?.applications.some(
    (a) => a.tenderId === id && a.vendorId === account.id
  );
  return (
    <Portal role="vendor">
      <Heading
        title={`Apply: ${t.title}`}
        subtitle="Complete the proposal and attach all required documents."
      />
      <Panel title="Financial proposal">
        <FormBuilder
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
        />
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
        subtitle="Select a document from your vault or enter a demo filename. No real files are uploaded."
      >
        <div className="space-y-4">
          {t.documents.map((d) => (
            <div key={d} className="rounded-lg border border-line p-3">
              <p className="mb-2 text-sm font-semibold">{d} *</p>
              <div className="grid gap-2 sm:grid-cols-2">
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
              </div>
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
              existing ||
              t.status !== 'open' ||
              Number(price) <= 0 ||
              Number(days) <= 0 ||
              t.documents.some((d) => !files[d]) ||
              t.requirements.some((r) => !responses[r.id])
            }
            onClick={() => {
              try {
                positiveAmount(price);
                positiveAmount(days);
                futureDate(t.deadline);
                setError('');
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
                setError(
                  e instanceof Error ? e.message : 'Could not save application.'
                );
              }
            }}
          >
            {existing ? 'Already applied' : 'Submit application'}
          </Action>
        </div>
      </Panel>
    </Portal>
  );
}
