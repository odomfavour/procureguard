'use client';
import { useState } from 'react';
import { TreeView } from '@msflib/react-components/tree-view';
import { missingDocuments } from '@/lib/compliance';
import {
  CATEGORY_LABELS,
  DOCUMENT_CATEGORY,
  DOCUMENT_LABELS,
} from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import type {
  DocumentCategory,
  TenderRequirements,
  VendorDocument,
} from '@/types';
const order: DocumentCategory[] = [
  'company',
  'compliance',
  'financial',
  'technical',
  'contracts',
];
export function DocumentVault({
  documents,
  requirements,
}: {
  documents: VendorDocument[];
  requirements: TenderRequirements;
}) {
  const [selected, setSelected] = useState('');
  const missing = missingDocuments(
    requirements,
    documents.map((d) => d.type)
  );
  const doc = documents.find((d) => d.id === selected);
  const items = order
    .map((category) => ({
      id: category,
      label: CATEGORY_LABELS[category],
      children: [
        ...documents
          .filter((d) => d.category === category)
          .map((d) => ({
            id: d.id,
            label: `${d.name} · ${formatDate(d.uploadedAt)}`,
          })),
        ...missing
          .filter((t) => DOCUMENT_CATEGORY[t] === category)
          .map((t) => ({
            id: `missing-${t}`,
            label: `${DOCUMENT_LABELS[t]} not submitted`,
            disabled: true,
          })),
      ],
    }))
    .filter((item) => item.children.length);
  return (
    <div className="px-5 py-4">
      <TreeView
        items={items}
        defaultExpandedItems={order}
        showIcons
        onItemClick={(_, id) => setSelected(id)}
        aria-label="Vendor document categories"
      />
      {doc && (
        <p className="mt-3 text-xs text-ink-soft">
          {doc.name}: fictional fixture. Original file is not available for
          download. Use the live document vault for real downloads.
        </p>
      )}
    </div>
  );
}
