'use client';
import { useState, useSyncExternalStore } from 'react';
import { useAuth } from '@msflib/react-auth';
import { PageLoader } from '@/components/ui/page-loader';
import { PageState } from '@/components/ui/page-state';
import Link from 'next/link';
import { TreeView } from '@msflib/react-components/tree-view';
import FormBuilder from '@/components/msflib/form-builder';
import { field, submit } from '@/components/ui/fields';
import { Portal, Panel, Heading } from './portal';
import { useData, docs } from './common';
import { session } from '@/lib/prototype';
const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;
export function Vault() {
  const auth = useAuth();
  const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const { db, update } = useData();
  const a = db?.accounts.find((x) => x.id === session());
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [selected, setSelected] = useState('');
  if (!hydrated || auth.status === 'loading') return <PageLoader label="Opening your document vault…" />;
  if (auth.status === 'authenticated') return <Portal role="vendor">
    <Heading title="Business document vault" subtitle="Business verification documents and tender attachments." />
    <Panel title="Saved documents">
      <p className="text-sm text-ink-soft">Documents submitted during onboarding and tender applications are uploaded through those forms. This vault is not yet connected to an API for listing or retrieving your saved files.</p>
      <p className="mt-3 text-sm text-ink-soft">Your documents are not displayed here yet; this does not mean your previous uploads are missing.</p>
      <Link href="/vendor/applications" className="mt-4 inline-block text-sm font-semibold text-brand hover:underline">View my applications</Link>
    </Panel>
  </Portal>;
  if (!a) return <PageState title="Sign in as a vendor to view your documents" backHref="/login" backLabel="Sign in" />;
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
          Demo filenames only. File contents are not uploaded or verified.
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
