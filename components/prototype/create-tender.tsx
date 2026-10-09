'use client';
import FormBuilder from '@/components/msflib/form-builder';
import { field } from '@/components/ui/fields';
import DraggableList from '@msflib/react-components/draggable';
import { positiveAmount, futureDate } from '@/lib/schemas/procurement';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Check,
  FileText,
  GripVertical,
  ListChecks,
  MapPin,
  Package,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from 'lucide-react';
import { uid, session, notify, money } from '@/lib/prototype';
import { Portal, Panel, Action, Field, Heading } from './portal';
import { useData, btn, select, docs } from './common';
import { GridFormLayout } from '../msflib/procurement-form-layout';

function ReviewSection({
  icon,
  title,
  onEdit,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-white">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="text-brand">{icon}</span>
          {title}
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand hover:bg-brand/10"
        >
          <Pencil className="h-3 w-3" />
          Edit
        </button>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-paper p-3">
      <span className="mt-0.5 text-brand">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-ink-soft">
          {label}
        </p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export function CreateTender() {
  const router = useRouter();
  const { update } = useData();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [kind, setKind] = useState('Goods');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [location, setLocation] = useState('');
  const [items, setItems] = useState([
    { name: '', quantity: 1, unit: 'units' },
  ]);
  const [reqs, setReqs] = useState([{ id: uid(), label: '', value: '' }]);
  const [selected, setSelected] = useState<string[]>([
    'Quotation',
    'Company Profile',
  ]);
  const [customDoc, setCustomDoc] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const steps = [
    'Tender details',
    'Line items',
    'Requirements',
    'Documents',
    'Review',
  ];

  const missing = [
    !title.trim() && 'Tender title',
    !category.trim() && 'Category',
    !description.trim() && 'Description',
    Number(budget) <= 0 && 'Maximum budget',
    !deadline && 'Submission deadline',
    !items.some((x) => x.name.trim()) && 'At least one line item',
  ].filter(Boolean) as string[];

  const filledItems = items.filter((x) => x.name.trim());
  const filledReqs = reqs.filter((x) => x.label.trim());
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <Portal role="buyer">
      <Heading
        title="Create tender"
        subtitle="Flexible procurement for any goods, services or works."
        action={
          <Link
            href="/dashboard"
            className={`${btn} inline-flex items-center gap-2`}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        }
      />
      <Panel>
        {/* Stepper */}
        <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-brand transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mb-4 text-xs text-ink-soft">
          Step {step + 1} of {steps.length}
        </p>
        <div className="mb-6 flex gap-2">
          {steps.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStep(i)}
                className={`flex flex-1 items-center gap-2 rounded-lg border p-2 text-left text-xs transition-colors ${
                  active
                    ? 'border-brand bg-brand text-white'
                    : done
                      ? 'border-brand/30 bg-brand/5 text-ink'
                      : 'border-line bg-paper text-ink-soft hover:bg-brand/5'
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                    active
                      ? 'bg-white/20 text-white'
                      : done
                        ? 'bg-brand text-white'
                        : 'bg-line text-ink-soft'
                  }`}
                >
                  {done ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span className="hidden truncate lg:inline">{s}</span>
              </button>
            );
          })}
        </div>

        <h2 className="mb-4 text-lg font-semibold">{steps[step]}</h2>

        {step === 0 ? (
          <div className="mx-auto w-full max-w-5xl">
            <FormBuilder
              elements={[
                {
                  ...field('title', 'Tender title'),
                  width: 50,
                  placeholder: 'e.g. Supply of office equipment',
                },
                {
                  ...field('category', 'Category'),
                  width: 50,
                  placeholder: 'e.g. Office supplies',
                },
                {
                  ...field('kind', 'Procurement type'),
                  dType: 'string',
                  eType: 'select',
                  width: 50,
                  placeholder: 'Select procurement type',
                  mData: {
                    select: true,
                    options: [
                      { value: 'Goods', label: 'Goods' },
                      { value: 'Services', label: 'Services' },
                      { value: 'Works', label: 'Works' },
                    ],
                    sx: {
                      width: '100%',
                      '& .MuiInputBase-root': {
                        width: '100%',
                        borderRadius: '8px',
                      },
                    },
                  },
                },
                {
                  ...field('budget', 'Maximum budget (NGN)', 'number'),
                  width: 33,
                  placeholder: 'Enter maximum budget',
                },
                {
                  ...field('deadline', 'Submission deadline', 'date'),
                  width: 33,
                },
                {
                  ...field('location', 'Delivery / service location'),
                  width: 33,
                  placeholder: 'e.g. Lagos, Nigeria',
                },
                {
                  ...field('description', 'Description', 'textarea'),
                  width: 100,
                  placeholder: 'Describe your procurement requirements...',
                  mData: {
                    rows: 5,
                  },
                },
              ]}
              formData={{
                title,
                category,
                kind,
                budget,
                deadline,
                location,
                description,
              }}
              setFormData={(
                change: React.SetStateAction<Record<string, unknown>>
              ) => {
                const current = {
                  title,
                  category,
                  kind,
                  budget,
                  deadline,
                  location,
                  description,
                };

                const next =
                  typeof change === 'function' ? change(current) : change;

                setTitle(String(next.title ?? ''));
                setCategory(String(next.category ?? ''));
                setKind(String(next.kind ?? 'Goods'));
                setBudget(String(next.budget ?? ''));
                setDeadline(String(next.deadline ?? ''));
                setLocation(String(next.location ?? ''));
                setDescription(String(next.description ?? ''));
              }}
              onSubmit={() => {}}
            />
          </div>
        ) : step === 1 ? (
          <div className="space-y-4">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-soft">
                Order (drag to reorder)
              </p>
              <DraggableList
                items={items.map((item, i) => ({ ...item, id: String(i) }))}
                onDragEnd={(ordered) =>
                  setItems(
                    ordered.map(({ name, quantity, unit }) => ({
                      name,
                      quantity,
                      unit,
                    }))
                  )
                }
                renderItem={(item) => (
                  <div className="my-2 flex items-center gap-2 rounded-lg border border-line bg-paper p-3 text-sm">
                    <GripVertical className="h-4 w-4 shrink-0 text-ink-soft" />
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {item.name || 'Untitled deliverable'}
                    </span>
                    <span className="shrink-0 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                )}
              />
            </div>
            {items.map((item, i) => (
              <div
                key={i}
                className="rounded-xl border border-line bg-white p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand/10 text-[10px] text-brand">
                      {i + 1}
                    </span>
                    Line item
                  </span>
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-risk-high hover:bg-risk-high/10"
                    onClick={() => setItems((p) => p.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="sm:col-span-2">
                    <Field
                      label="Item / deliverable"
                      value={item.name}
                      onChange={(v) =>
                        setItems((p) =>
                          p.map((x, j) => (i === j ? { ...x, name: v } : x))
                        )
                      }
                    />
                  </div>
                  <Field
                    label="Quantity"
                    type="number"
                    value={item.quantity}
                    onChange={(v) =>
                      setItems((p) =>
                        p.map((x, j) =>
                          i === j ? { ...x, quantity: Number(v) } : x
                        )
                      )
                    }
                  />
                  <Field
                    label="Unit"
                    value={item.unit}
                    onChange={(v) =>
                      setItems((p) =>
                        p.map((x, j) => (i === j ? { ...x, unit: v } : x))
                      )
                    }
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              className={`${btn} inline-flex items-center gap-2`}
              onClick={() =>
                setItems((p) => [
                  ...p,
                  { name: '', quantity: 1, unit: 'units' },
                ])
              }
            >
              <Plus className="h-4 w-4" />
              Add line item
            </button>
          </div>
        ) : step === 2 ? (
          <div className="space-y-4">
            <p className="text-sm text-ink-soft">
              List anything vendors must meet, such as certifications, delivery
              timelines or warranty terms.
            </p>
            {reqs.map((r, i) => (
              <div
                key={r.id}
                className="rounded-xl border border-line bg-white p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
                    <ListChecks className="h-4 w-4 text-brand" />
                    Requirement {i + 1}
                  </span>
                  {reqs.length > 1 && (
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-risk-high hover:bg-risk-high/10"
                      onClick={() =>
                        setReqs((p) => p.filter((_, j) => j !== i))
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Requirement name"
                    value={r.label}
                    onChange={(v) =>
                      setReqs((p) =>
                        p.map((x, j) => (i === j ? { ...x, label: v } : x))
                      )
                    }
                  />
                  <Field
                    label="Expected value / description"
                    value={r.value}
                    onChange={(v) =>
                      setReqs((p) =>
                        p.map((x, j) => (i === j ? { ...x, value: v } : x))
                      )
                    }
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              className={`${btn} inline-flex items-center gap-2`}
              onClick={() =>
                setReqs((p) => [...p, { id: uid(), label: '', value: '' }])
              }
            >
              <Plus className="h-4 w-4" />
              Add requirement
            </button>
          </div>
        ) : step === 3 ? (
          <div>
            <p className="mb-4 text-sm text-ink-soft">
              Select mandatory documents. Each will become an upload field in
              the vendor application.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[...new Set([...docs, ...selected])].map((d) => {
                const on = selected.includes(d);
                return (
                  <label
                    key={d}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-colors ${
                      on
                        ? 'border-brand bg-brand/5'
                        : 'border-line bg-white hover:border-brand/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-brand"
                      checked={on}
                      onChange={(e) =>
                        setSelected((p) =>
                          e.target.checked
                            ? [...p, d]
                            : p.filter((x) => x !== d)
                        )
                      }
                    />
                    <FileText
                      className={`h-4 w-4 shrink-0 ${on ? 'text-brand' : 'text-ink-soft'}`}
                    />
                    <span className="font-medium">{d}</span>
                  </label>
                );
              })}
            </div>
            <div className="mt-5 rounded-xl border border-dashed border-line p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-soft">
                Need something else?
              </p>
              <div className="flex gap-2">
                <input
                  className={select}
                  value={customDoc}
                  onChange={(e) => setCustomDoc(e.target.value)}
                  placeholder="Custom required document"
                />
                <Action
                  onClick={() => {
                    if (customDoc.trim())
                      setSelected((p) => [...p, customDoc.trim()]);
                    setCustomDoc('');
                  }}
                >
                  Add
                </Action>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl bg-paper p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">
                  {kind}
                </span>
                {category && (
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-ink-soft ring-1 ring-inset ring-line">
                    {category}
                  </span>
                )}
              </div>
              <h3 className="mt-2 text-xl font-semibold">
                {title || 'Untitled tender'}
              </h3>
              <p className="mt-1 whitespace-pre-line text-sm text-ink-soft">
                {description || 'No description provided.'}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Fact
                  icon={<Wallet className="h-4 w-4" />}
                  label="Max budget"
                  value={money(Number(budget) || 0)}
                />
                <Fact
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="Deadline"
                  value={deadline || 'Not set'}
                />
                <Fact
                  icon={<MapPin className="h-4 w-4" />}
                  label="Location"
                  value={location || 'Not specified'}
                />
              </div>
            </div>

            <ReviewSection
              icon={<Package className="h-4 w-4" />}
              title={`Line items (${filledItems.length})`}
              onEdit={() => setStep(1)}
            >
              {filledItems.length ? (
                <ul className="divide-y divide-line">
                  {filledItems.map((x, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between gap-3 py-2 text-sm first:pt-0 last:pb-0"
                    >
                      <span className="truncate font-medium">{x.name}</span>
                      <span className="shrink-0 text-xs text-ink-soft">
                        {x.quantity} {x.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-soft">No line items added</p>
              )}
            </ReviewSection>

            <ReviewSection
              icon={<ListChecks className="h-4 w-4" />}
              title={`Requirements (${filledReqs.length})`}
              onEdit={() => setStep(2)}
            >
              {filledReqs.length ? (
                <dl className="space-y-2">
                  {filledReqs.map((x) => (
                    <div
                      key={x.id}
                      className="flex flex-col gap-0.5 text-sm sm:flex-row sm:justify-between sm:gap-4"
                    >
                      <dt className="font-medium">{x.label}</dt>
                      <dd className="text-ink-soft">{x.value || '—'}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-ink-soft">No requirements added</p>
              )}
            </ReviewSection>

            <ReviewSection
              icon={<FileText className="h-4 w-4" />}
              title={`Required documents (${selected.length})`}
              onEdit={() => setStep(3)}
            >
              {selected.length ? (
                <div className="flex flex-wrap gap-2">
                  {selected.map((d) => (
                    <span
                      key={d}
                      className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-soft">No documents required</p>
              )}
            </ReviewSection>

            {missing.length > 0 && (
              <div className="flex items-start gap-3 rounded-xl border border-risk-high/30 bg-risk-high/5 p-4 text-sm">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-risk-high" />
                <div>
                  <p className="font-medium text-risk-high">
                    Complete these before publishing
                  </p>
                  <ul className="mt-1 list-disc pl-4 text-ink-soft">
                    {missing.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="mt-4 flex items-center gap-2 rounded-lg bg-risk-high/5 p-3 text-sm text-risk-high"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        <div className="mt-7 flex justify-between border-t border-line pt-4">
          <button
            type="button"
            className={btn}
            onClick={() =>
              step === 0 ? router.push('/dashboard') : setStep((s) => s - 1)
            }
          >
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {step < 4 ? (
            <Action onClick={() => setStep((s) => s + 1)}>Continue</Action>
          ) : (
            <Action
              disabled={missing.length > 0}
              onClick={() => {
                try {
                  positiveAmount(budget);
                  futureDate(deadline);
                  for (const item of items.filter((x) => x.name.trim()))
                    positiveAmount(item.quantity);
                  if (!session()) throw new Error('Sign in before publishing.');
                  setError('');
                  const id = uid();
                  update((d) => {
                    d.tenders.unshift({
                      id,
                      buyerId: session()!,
                      title,
                      description,
                      category,
                      type: kind,
                      budget: Number(budget),
                      deadline,
                      location,
                      items: items.filter((x) => x.name),
                      requirements: reqs.filter((x) => x.label),
                      documents: selected,
                      status: 'open',
                    });
                    d.accounts
                      .filter((a) => a.role === 'vendor')
                      .forEach((a) =>
                        notify(d, a.id, `New public tender published: ${title}`)
                      );
                  });
                  router.push(`/tenders/${id}`);
                } catch (e) {
                  setError(
                    e instanceof Error ? e.message : 'Could not save tender.'
                  );
                }
              }}
            >
              Publish tender
            </Action>
          )}
        </div>
      </Panel>
    </Portal>
  );
}
