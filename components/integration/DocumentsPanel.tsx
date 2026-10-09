'use client';
import { useState } from 'react';
import { useDocuments } from '@msflib/react-documents';
import { TreeView } from '@msflib/react-components/tree-view';
import { Section, Badge, Loading } from '@/components/ui/shared';
export default function DocumentsPanel({
  run,
}: {
  run: (action: () => Promise<unknown>) => void;
}) {
  const api = useDocuments();
  const [selected, setSelected] = useState<number | null>(null);
  const document = api.documents.find((d) => d.record_id === selected);
  return (
    <Section title="Vendor document vault">
      <label className="upload-card">
        Upload a business document
        <input
          type="file"
          disabled={api.loading.upload}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file)
              run(async () => {
                const fd = new FormData();
                fd.append('file', file, file.name);
                fd.append('is_private', 'true');
                const record = await api.uploadDocument(fd);
                setSelected(record.record_id);
                await api.refetch();
              });
          }}
        />
      </label>
      <button onClick={() => run(api.refetch)}>
        Refresh documents and ingestion
      </button>
      {api.loading.documents ? (
        <Loading />
      ) : (
        <TreeView
          items={[
            {
              id: 'vault',
              label: 'Verification documents',
              children: api.documents.map((d) => ({
                id: String(d.record_id),
                label: `${d.name || d.source_key} · ${d.status}`,
              })),
            },
          ]}
          defaultExpandedItems={['vault']}
          onItemClick={(_, id) => {
            const record = Number(id);
            if (Number.isFinite(record))
              run(async () => {
                await api.getDocument(record);
                setSelected(record);
              });
          }}
          aria-label="Live workspace documents"
          showIcons
        />
      )}
      {document && (
        <div>
          <h3>{document.name || document.source_key}</h3>
          <Badge>{document.status}</Badge>
          {document.last_error && <p role="alert">{document.last_error}</p>}
          <div className="actions">
            <button
              disabled={api.loading.download}
              onClick={() =>
                run(async () => {
                  const blob = await api.downloadDocument(document.record_id);
                  const url = URL.createObjectURL(blob);
                  const link = window.document.createElement('a');
                  link.href = url;
                  link.download = document.name || 'document';
                  link.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                })
              }
            >
              Download
            </button>
            <button
              onClick={() =>
                run(async () => {
                  await api.promoteDocument(document.record_id, {
                    clear_private: true,
                  });
                  await api.refetch();
                })
              }
            >
              Share with workspace AI corpus
            </button>
          </div>
        </div>
      )}
      <p className="hint">
        Uploads remain private until you explicitly share them. Indexing is
        performed by the backend worker.
      </p>
      <pre>{JSON.stringify(api.ingestionStatus?.queue || {}, null, 2)}</pre>
      {api.ingestionJobs.map((j) => (
        <p key={j.id}>
          Job {j.id}: {j.status}
          {j.error ? ` — ${j.error}` : ''}
        </p>
      ))}
    </Section>
  );
}
