'use client';
import { useState } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Tabs, Tab } from '@mui/material';
import { ChevronDown, CheckCircle2, AlertCircle, ShieldCheck, ClipboardCheck } from 'lucide-react';
import { MarkdownMessage } from '@msflib/react-components/markdown';
import { DataTable, type Column } from '@/components/msflib/data-table';
import { DocumentPreview, type PreviewDocument } from '@/components/ui/document-preview';
import { formatDate } from '@/utils/format-date';

type RecordValue = Record<string, unknown>;
function object(value: unknown): RecordValue {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as RecordValue : {};
}
function label(value: string) { return value.replaceAll('_', ' ').replaceAll('-', ' '); }
function text(value: unknown): string {
  if (value == null) return 'Not assessed';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.length ? value.map(text).join('; ') : 'None reported';
  if (typeof value === 'object') return Object.entries(object(value)).map(([key, entry]) => `${label(key)}: ${text(entry)}`).join(' · ');
  return String(value);
}
function needsReview(section: RecordValue) { return !['compliant', 'pass', 'verified'].includes(String(section.status)); }
function Status({ value }: { value: unknown }) {
  const status = String(value || 'not assessed');
  const good = ['compliant', 'pass', 'addressed', 'verified', 'none'].includes(status);
  const bad = ['fail', 'non_compliant', 'high', 'mismatch_detected'].includes(status);
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${good ? 'bg-emerald-50 text-emerald-700' : bad ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}>{good ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}{label(status)}</span>;
}

export function AnalysisReport({ value }: { value: unknown }) {
  const [tab, setTab] = useState(0);
  const [preview, setPreview] = useState<PreviewDocument | null>(null);
  if (value == null) return <p className="text-sm text-ink-soft">No analysis has been run yet.</p>;
  if (typeof value === 'string') return <MarkdownMessage content={value} />;
  const envelope = object(value);
  const report = object(envelope.analysis ?? envelope.report ?? envelope.result ?? value);
  const sections = Array.isArray(report.sections) ? report.sections.map(object) : [];
  if (!sections.length) return <p className="text-sm text-ink-soft">{text(report.summary ?? envelope.message ?? 'No assessment sections were returned.')}</p>;
  const attention = sections.filter(needsReview);
  const technical = sections.find((section) => section.key === 'technical_proposal');
  const financial = sections.find((section) => section.key === 'financial');
  const dossier = object(report.dossier);
  const visible = tab === 1 ? attention : sections;
  const score = (section?: RecordValue) => typeof section?.score === 'number' ? `${section.score}/100` : 'Not scored';
  function detailValue(entry: unknown, title: string) {
    if (!Array.isArray(entry) || !entry.length || !entry.every((row) => row && typeof row === 'object' && !Array.isArray(row))) return <p className="whitespace-pre-wrap text-sm leading-6 text-ink-soft">{text(entry)}</p>;
    const rows = entry.map((value, index) => ({ ...object(value), id: String(index) }));
    const fields = [...new Set(entry.flatMap((value) => Object.keys(object(value))))].filter((key) => key !== 'id' && !key.endsWith('_id'));
    const columns: Column<RecordValue & { id: string }>[] = fields.map((field) => ({
      field, headerName: label(field), minWidth: field === 'evidence' || field === 'summary' || field === 'mitigation' ? 280 : 170, flex: 1,
      renderCell: ({ row }) => {
        if (field === 'url') {
          try {
            const url = new URL(String(row[field]));
            if (['https:', 'http:'].includes(url.protocol)) return <button type="button" className="font-semibold text-brand hover:underline" onClick={() => setPreview({ name: String(row.name || 'Document'), url: url.href, format: String(row.file_format || '') })}>Preview file</button>;
          } catch { /* Render unsupported URLs as text. */ }
        }
        return <span title={text(row[field])}>{text(row[field])}</span>;
      },
    }));
    return <DataTable title={title} rows={rows} columns={columns} />;
  }
  return <div className="space-y-5">
    <div className="rounded-xl bg-[#101e42] p-5 text-white sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-200">Applicant assessment</p><h3 className="font-display text-xl font-bold">{String(dossier.vendor_business_name || 'Vendor assessment')}</h3><p className="mt-1 text-sm text-blue-100">{String(dossier.tender_title || 'Procurement analysis')}</p></div><span className="rounded-full bg-white/10 px-3 py-1 text-xs">Analyzed {formatDate(String(report.created_at || ''))}</span></div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          ['Technical coverage', score(technical), 'Measures response coverage'],
          ['Financial score', score(financial), 'Based on arithmetic and budget'],
          ['Sections needing review', `${attention.length} of ${sections.length}`, 'Review the supporting evidence'],
        ].map(([title, amount, note]) => <div key={title} className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-blue-100">{title}</p><p className="mt-2 text-2xl font-bold">{amount}</p><p className="mt-2 text-xs text-blue-200">{note}</p></div>)}
      </div>
    </div>
    {report.disclaimer != null && <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"><ShieldCheck size={20} className="mt-0.5 shrink-0 text-amber-700" /><p className="text-sm leading-6 text-amber-900">{text(report.disclaimer)}</p></div>}
    <div className="flex flex-wrap gap-2">{sections.map((section, index) => <a key={String(section.key || index)} href={`#analysis-${index}`} className="rounded-lg border border-line bg-white px-3 py-2 text-xs font-medium text-ink hover:border-brand" onClick={() => setTab(0)}>{String(section.title || label(String(section.key)))} <span className="ml-1 text-ink-soft">{typeof section.score === 'number' ? `${section.score}/100` : label(String(section.status || ''))}</span></a>)}</div>
    <Tabs value={tab} onChange={(_, next: number) => setTab(next)} variant="scrollable" scrollButtons="auto" aria-label="Analysis sections"><Tab label={`All sections (${sections.length})`} /><Tab label={`Needs review (${attention.length})`} /></Tabs>
    {visible.length === 0 && <p className="rounded-xl bg-emerald-50 p-5 text-sm text-emerald-800">No sections are flagged for review.</p>}
    {visible.map((section) => {
      const index = sections.indexOf(section);
      const findings: (RecordValue & { id: string })[] = Array.isArray(section.findings) ? section.findings.map((value, index) => ({ ...object(value), id: String(index) })) : [];
      const details = object(section.details);
      return <Accordion key={String(section.key || index)} id={`analysis-${index}`} defaultExpanded={index === 0} disableGutters sx={{ border: '1px solid #dce1e9', borderRadius: '12px !important', boxShadow: 'none', '&:before': { display: 'none' }, scrollMarginTop: 24 }}>
        <AccordionSummary expandIcon={<ChevronDown size={20} />}><div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3 py-2 pr-3"><div className="flex items-center gap-2"><ClipboardCheck size={18} className="shrink-0 text-brand" /><h4 className="text-sm font-semibold">{String(section.title || label(String(section.key)))}</h4></div><div className="flex items-center gap-2">{typeof section.score === 'number' && <span className="text-sm font-bold text-ink">{section.score}/100</span>}<Status value={section.status} /></div></div></AccordionSummary>
        <AccordionDetails>
          <p className="mb-5 text-sm leading-7 text-ink-soft">{text(section.summary)}</p>
          {!!findings.length && <DataTable title="Findings & evidence" rows={findings} columns={[
            { field: 'topic', headerName: 'Check', minWidth: 180, flex: 1 },
            { field: 'result', headerName: 'Result', width: 140, renderCell: ({ row }) => <Status value={row.result} /> },
            { field: 'evidence', headerName: 'Evidence', minWidth: 320, flex: 2, renderCell: ({ row }) => <span title={text(row.evidence)}>{text(row.evidence)}</span> },
            { field: 'severity', headerName: 'Severity', width: 140, renderCell: ({ row }) => <Status value={row.severity} /> },
          ]} />}
          <details className="mt-5 rounded-lg border border-line p-4"><summary className="cursor-pointer text-sm font-semibold text-brand">Supporting details & limitations</summary><div className="mt-4 space-y-5">{Object.entries(details).filter(([key]) => key !== 'mandatory_checks').map(([key, entry]) => <section key={key}><h5 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">{label(key)}</h5>{detailValue(entry, label(key))}</section>)}</div></details>
        </AccordionDetails>
      </Accordion>;
    })}
    {report.scoring_rules != null && <details className="rounded-xl border border-line p-4"><summary className="cursor-pointer text-sm font-semibold text-brand">How scores and verification are defined</summary><dl className="mt-4 space-y-4">{Object.entries(object(report.scoring_rules)).map(([key, value]) => <div key={key}><dt className="text-sm font-semibold capitalize">{label(key)}</dt><dd className="mt-1 text-sm leading-6 text-ink-soft">{text(value)}</dd></div>)}</dl></details>}
    <DocumentPreview document={preview} onClose={() => setPreview(null)} />
  </div>;
}
