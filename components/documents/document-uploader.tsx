'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Check, FileUp, LoaderCircle } from 'lucide-react';
import { DOCUMENT_LABELS, INGESTION_STAGES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { DocumentType } from '@/types';

interface UploadItem {
  id: string;
  fileName: string;
  stage: number;
}

interface DocumentUploaderProps {
  documentTypes: DocumentType[];
}

const LAST_STAGE = INGESTION_STAGES.length - 1;

/**
 * Demo uploader: walks each file through the ingestion stages locally.
 * Replace `startIngestion` with a multipart POST to the ingestion endpoint
 * and drive `stage` from the documents.* events.
 */
export function DocumentUploader({ documentTypes }: DocumentUploaderProps) {
  const [type, setType] = useState<DocumentType>(documentTypes[0]);
  const [items, setItems] = useState<UploadItem[]>([]);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const active = timers.current;
    return () => active.forEach((id) => window.clearInterval(id));
  }, []);

  function startIngestion(id: string) {
    const timer = window.setInterval(() => {
      setItems((current) =>
        current.map((item) =>
          item.id === id && item.stage < LAST_STAGE
            ? { ...item, stage: item.stage + 1 }
            : item
        )
      );
    }, 900);
    timers.current.push(timer);
    window.setTimeout(
      () => window.clearInterval(timer),
      900 * LAST_STAGE + 100
    );
  }

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const added = files.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      fileName: file.name,
      stage: 0,
    }));
    setItems((current) => [...added, ...current]);
    added.forEach((item) => startIngestion(item.id));
    event.target.value = '';
  }

  return (
    <div className="flex flex-col gap-4 px-5 py-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="document-type" className="text-sm font-medium">
          Document type
        </label>
        <select
          id="document-type"
          value={type}
          onChange={(e) => setType(e.target.value as DocumentType)}
          className="h-10 rounded-md border border-line bg-surface px-3 text-sm"
        >
          {documentTypes.map((t) => (
            <option key={t} value={t}>
              {DOCUMENT_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm transition-colors hover:bg-paper has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand">
        <FileUp className="size-5 text-brand" aria-hidden />
        <span className="font-medium">
          Choose {DOCUMENT_LABELS[type].toLowerCase()} files
        </span>
        <span className="text-xs text-ink-soft">PDF or image scans</span>
        <input
          type="file"
          multiple
          accept=".pdf,image/*"
          className="sr-only"
          onChange={handleFiles}
        />
      </label>

      {items.length > 0 && (
        <ul className="flex flex-col gap-3" aria-live="polite">
          {items.map((item) => {
            const done = item.stage === LAST_STAGE;
            return (
              <li key={item.id} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-sm">
                  {done ? (
                    <Check className="size-4 text-risk-low" aria-hidden />
                  ) : (
                    <LoaderCircle
                      className="size-4 animate-spin text-brand"
                      aria-hidden
                    />
                  )}
                  <span className="min-w-0 flex-1 truncate">
                    {item.fileName}
                  </span>
                  <span
                    className={cn(
                      'text-xs',
                      done ? 'text-risk-low' : 'text-ink-soft'
                    )}
                  >
                    {INGESTION_STAGES[item.stage]}
                  </span>
                </div>
                <div className="flex gap-1" aria-hidden>
                  {INGESTION_STAGES.map((stage, index) => (
                    <span
                      key={stage}
                      className={cn(
                        'h-1 flex-1 rounded-full',
                        index <= item.stage ? 'bg-brand' : 'bg-paper'
                      )}
                    />
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
