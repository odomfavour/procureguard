'use client';
import FormBuilder from '@/components/msflib/form-builder';
import { field } from '@/components/ui/fields';
import DraggableList from '@msflib/react-components/draggable';
import { positiveAmount, futureDate } from '@/lib/schemas/procurement';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { uid, session, notify, money } from '@/lib/prototype';
import { Portal, Panel, Action, Field, Heading } from './portal';
import { useData, btn, select, docs } from './common';
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
  return (
    <Portal role="buyer">
      <Heading
        title="Create tender"
        subtitle="Flexible procurement for any goods, services or works."
      />
      <Panel>
        <div className="mb-6 flex flex-wrap gap-2">
          {steps.map((s, i) => (
            <button
              key={s}
              onClick={() => setStep(i)}
              className={`rounded-lg px-3 py-2 text-xs ${i === step ? 'bg-brand text-white' : 'bg-paper'}`}
            >
              {i + 1}. {s}
            </button>
          ))}
        </div>
        {step === 0 ? (
          <FormBuilder
            elements={[
              field('title', 'Tender title'),
              field('category', 'Category'),
              {
                ...field('kind', 'Procurement type'),
                dType: 'list',
                eType: undefined,
                mData: {
                  options: ['Goods', 'Services', 'Works'].map((value) => ({
                    value,
                    label: value,
                  })),
                },
              },
              field('budget', 'Maximum budget (NGN)', 'number'),
              field('deadline', 'Submission deadline', 'date'),
              field('location', 'Delivery / service location'),
              field('description', 'Description', 'textarea'),
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
              const next =
                typeof change === 'function'
                  ? change({
                      title,
                      category,
                      kind,
                      budget,
                      deadline,
                      location,
                      description,
                    })
                  : change;
              setTitle(String(next.title || ''));
              setCategory(String(next.category || ''));
              setKind(String(next.kind || 'Goods'));
              setBudget(String(next.budget || ''));
              setDeadline(String(next.deadline || ''));
              setLocation(String(next.location || ''));
              setDescription(String(next.description || ''));
            }}
            onSubmit={() => {}}
          />
        ) : step === 1 ? (
          <div className="space-y-4">
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
                <div className="my-2 rounded-lg border border-line bg-paper p-3 text-sm">
                  ⠿ {item.name || 'Untitled deliverable'} · {item.quantity}{' '}
                  {item.unit}
                </div>
              )}
            />
            {items.map((item, i) => (
              <div
                key={i}
                className="grid gap-3 rounded-lg border border-line p-3 sm:grid-cols-4"
              >
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
                <button
                  className="text-left text-xs text-risk-high"
                  onClick={() => setItems((p) => p.filter((_, j) => j !== i))}
                >
                  Remove item
                </button>
              </div>
            ))}
            <button
              className={btn}
              onClick={() =>
                setItems((p) => [
                  ...p,
                  { name: '', quantity: 1, unit: 'units' },
                ])
              }
            >
              + Add line item
            </button>
          </div>
        ) : step === 2 ? (
          <div className="space-y-4">
            {reqs.map((r, i) => (
              <div key={r.id} className="grid gap-3 sm:grid-cols-2">
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
            ))}
            <button
              className={btn}
              onClick={() =>
                setReqs((p) => [...p, { id: uid(), label: '', value: '' }])
              }
            >
              + Add requirement
            </button>
          </div>
        ) : step === 3 ? (
          <div>
            <p className="mb-4 text-sm text-ink-soft">
              Select mandatory documents. Each will become an upload field in
              the vendor application.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[...new Set([...docs, ...selected])].map((d) => (
                <label
                  key={d}
                  className="flex gap-3 rounded-lg border border-line p-3 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(d)}
                    onChange={(e) =>
                      setSelected((p) =>
                        e.target.checked ? [...p, d] : p.filter((x) => x !== d)
                      )
                    }
                  />
                  {d}
                </label>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
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
        ) : (
          <div className="space-y-3 text-sm">
            <h3 className="text-xl font-semibold">
              {title || 'Untitled tender'}
            </h3>
            <p>{description}</p>
            <p>
              <b>Type:</b> {kind} · <b>Category:</b> {category} · <b>Budget:</b>{' '}
              {money(Number(budget) || 0)}
            </p>
            <p>
              <b>Items:</b>{' '}
              {items
                .filter((x) => x.name)
                .map((x) => `${x.quantity} ${x.unit} ${x.name}`)
                .join(', ')}
            </p>
            <p>
              <b>Requirements:</b>{' '}
              {reqs
                .filter((x) => x.label)
                .map((x) => `${x.label}: ${x.value}`)
                .join('; ')}
            </p>
            <p>
              <b>Documents:</b> {selected.join(', ')}
            </p>
          </div>
        )}
        {error && (
          <p role="alert" className="mt-4 text-sm text-risk-high">
            {error}
          </p>
        )}
        <div className="mt-7 flex justify-between">
          <button
            className={btn}
            disabled={step === 0}
            onClick={() => setStep((s) => s - 1)}
          >
            Back
          </button>
          {step < 4 ? (
            <Action onClick={() => setStep((s) => s + 1)}>Continue</Action>
          ) : (
            <Action
              disabled={
                !title.trim() ||
                !category.trim() ||
                !description.trim() ||
                !deadline ||
                Number(budget) <= 0 ||
                !items.some((x) => x.name.trim())
              }
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
