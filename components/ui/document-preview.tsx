'use client';

import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { X } from 'lucide-react';

export type PreviewDocument = { name: string; url: string | null; format: string };

export function DocumentPreview({ document, onClose }: { document: PreviewDocument | null; onClose: () => void }) {
  const format = document?.format.toLowerCase() || document?.url?.split('?')[0].split('.').pop()?.toLowerCase();
  const image = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif'].includes(format || '');
  return (
    <Dialog open={!!document} onClose={onClose} fullWidth maxWidth="lg" aria-labelledby="document-preview-title">
      <DialogTitle id="document-preview-title" sx={{ pr: 7 }}>
        {document?.name}
        <IconButton aria-label="Close preview" onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12 }}><X size={22} /></IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: { xs: 1, sm: 3 }, bgcolor: '#f1f3f6' }}>
        {document?.url && (image ? (
          // Remote uploads are displayed directly without configuring an image optimization host.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={document.url} alt={document.name} className="mx-auto max-h-[75dvh] max-w-full object-contain" />
        ) : format === 'pdf' ? (
          <iframe title={`${document.name} preview`} src={document.url} className="h-[70dvh] w-full rounded-lg border-0 bg-white" />
        ) : (
          <p className="p-8 text-center text-sm text-ink-soft">Preview is unavailable for this file type.</p>
        ))}
        {document?.url && <p className="mt-4 text-center text-sm"><a href={document.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand hover:underline">Open original file ↗</a></p>}
      </DialogContent>
    </Dialog>
  );
}
