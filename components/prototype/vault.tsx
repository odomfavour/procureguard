'use client';
import { useState } from 'react';
import { TreeView } from '@msflib/react-components/tree-view';
import FormBuilder from '@/components/msflib/form-builder';
import { field, submit } from '@/components/ui/fields';
import { Portal, Panel, Heading } from './portal';
import { useData, docs } from './common';
import { session } from '@/lib/prototype';
export function Vault() {
  const { db, update } = useData();
  const a = db?.accounts.find((x) => x.id === session());
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [selected, setSelected] = useState('');
  if (!a) return null;
  return (
    <Portal role="vendor">
      <Heading
        title="Business document vault"
        subtitle="Maintain CAC, tax, catalogue and professional documents for reuse in applications."
      />
      <Panel title="Saved documents">
        <TreeView
          items={[
            {
              id: 'business',
              label: 'Business verification',
              children: Object.entries(a.documents).map(
                ([label, filename]) => ({
                  id: label,
                  label: `${label} · ${filename}`,
                })
              ),
            },
          ]}
          defaultExpandedItems={['business']}
          onItemClick={(_, id) => setSelected(id)}
          showIcons
          aria-label="Business document vault"
        />
        {a.documents[selected] && (
          <button
            className="mt-3 text-sm text-risk-high"
            onClick={() =>
              update((d) => {
                delete d.accounts.find((x) => x.id === a.id)!.documents[
                  selected
                ];
              })
            }
          >
            Remove {selected}
          </button>
        )}
        <p className="mt-3 text-xs text-ink-soft">
          Demo filenames only. File contents are not uploaded or verified. Live
          uploads and downloads are available in the MSFLib workspace.
        </p>
      </Panel>
      <div className="h-5" />
      <Panel title="Add a document">
        <FormBuilder
          elements={[
            {
              ...field('label', 'Document type'),
              eType: undefined,
              dType: 'list',
              mData: {
                options: docs.map((value) => ({ value, label: value })),
              },
            },
            field('filename', 'Demo filename'),
            submit('Save document'),
          ]}
          formData={values}
          setFormData={setValues}
          resetFormOnSubmit
          onSubmit={(v: Record<string, unknown>) => {
            if (
              typeof v.label !== 'string' ||
              typeof v.filename !== 'string' ||
              !v.filename.trim()
            )
              return;
            const label = v.label,
              filename = v.filename;
            update((d) => {
              d.accounts.find((x) => x.id === a.id)!.documents[label] =
                filename;
            });
            setValues({});
          }}
        />
      </Panel>
    </Portal>
  );
}
