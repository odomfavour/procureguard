'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormBuilder, {
  type LayoutProps,
} from '@/components/msflib/form-builder';
import DraggableList from '@msflib/react-components/draggable';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { field, submit } from '@/components/ui/fields';
import { createTender } from '@/lib/api/procureguard';
import { DOCUMENT_LABELS } from '@/lib/constants';
import {
  requiredText,
  positiveAmount,
  futureDate,
} from '@/lib/schemas/procurement';
import type { DocumentType } from '@/types';
const selectable = (Object.keys(DOCUMENT_LABELS) as DocumentType[]).filter(
  (t) => t !== 'proforma_invoice' && t !== 'contract'
);
const numbers = [
  ['quantity', 'Quantity'],
  ['maxBudget', 'Maximum budget (₦)'],
  ['maxDeliveryDays', 'Delivery within (days)'],
  ['minRamGb', 'Minimum RAM (GB)'],
  ['minStorageGb', 'Minimum SSD (GB)'],
  ['minWarrantyYears', 'Minimum warranty (years)'],
] as const;
export function TenderForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<Record<string, unknown>>({
    title: '100 business laptops',
    description:
      'Supply and delivery of 100 business laptops with on-site warranty support.',
    deadline: '2026-11-05',
    quantity: 100,
    maxBudget: 80000000,
    maxDeliveryDays: 14,
    minRamGb: 16,
    minStorageGb: 512,
    minWarrantyYears: 3,
  });
  const [documents, setDocuments] = useState<DocumentType[]>(selectable);
  const elements = [
    field('title', 'Title'),
    field('description', 'Description', 'textarea'),
    field('deadline', 'Submission deadline', 'date'),
    ...numbers.map(([name, label]) => field(name, label, 'number')),
    submit('Create tender'),
  ];
  function Layout({ FormField }: LayoutProps) {
    return (
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader title="Tender details" />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormField elementName="title" />
            </div>
            <div className="sm:col-span-2">
              <FormField elementName="description" />
            </div>
            <FormField elementName="deadline" />
          </CardBody>
        </Card>
        <Card>
          <CardHeader
            title="Requirements"
            description="Vendor proposals are checked against these."
          />
          <CardBody className="grid gap-4 sm:grid-cols-3">
            {numbers.map(([name]) => (
              <FormField key={name} elementName={name} />
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader
            title="Required documents"
            description="Vendors must upload each of these. Drag selected documents to prioritize."
          />
          <CardBody>
            <fieldset className="flex flex-wrap gap-2">
              <legend className="sr-only">Required documents</legend>
              {selectable.map((type) => (
                <label
                  key={type}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm ${documents.includes(type) ? 'border-brand bg-brand-tint text-brand' : 'border-line text-ink-soft'}`}
                >
                  <input
                    className="sr-only"
                    type="checkbox"
                    checked={documents.includes(type)}
                    onChange={() =>
                      setDocuments((prev) =>
                        prev.includes(type)
                          ? prev.filter((t) => t !== type)
                          : [...prev, type]
                      )
                    }
                  />
                  {DOCUMENT_LABELS[type]}
                </label>
              ))}
            </fieldset>
            <div className="mt-4">
              <DraggableList
                items={documents.map((id) => ({ id }))}
                onDragEnd={(items) =>
                  setDocuments(items.map((i) => i.id as DocumentType))
                }
                renderItem={(item) => (
                  <div className="my-1 rounded-md border border-line bg-paper px-3 py-2 text-sm">
                    ⠿ {DOCUMENT_LABELS[item.id as DocumentType]}
                  </div>
                )}
              />
            </div>
          </CardBody>
        </Card>
        {error && (
          <p role="alert" className="text-sm text-risk-high">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/tenders')}
          >
            Cancel
          </Button>
          <FormField elementName="submit" />
        </div>
      </div>
    );
  }
  return (
    <FormBuilder
      elements={elements}
      formData={data}
      setFormData={setData}
      layout={Layout}
      loadingState={busy}
      onSubmit={async (v: Record<string, unknown>) => {
        setError('');
        setBusy(true);
        try {
          if (!documents.length)
            throw new Error('Choose at least one required document.');
          await createTender({
            title: requiredText(v.title, 'Title'),
            description: requiredText(v.description, 'Description'),
            deadline: new Date(futureDate(v.deadline)).toISOString(),
            requirements: {
              quantity: positiveAmount(v.quantity),
              maxBudget: positiveAmount(v.maxBudget),
              maxDeliveryDays: positiveAmount(v.maxDeliveryDays),
              minRamGb: positiveAmount(v.minRamGb),
              minStorageGb: positiveAmount(v.minStorageGb),
              minWarrantyYears: positiveAmount(v.minWarrantyYears),
              requiredDocuments: documents,
            },
          });
          router.push('/tenders');
          router.refresh();
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Could not create tender.');
        } finally {
          setBusy(false);
        }
      }}
    />
  );
}
