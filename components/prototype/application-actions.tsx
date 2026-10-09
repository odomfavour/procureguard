'use client';
import { useRef, useState } from 'react';
import { useAuth } from '@msflib/react-auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MarkdownMessage } from '@msflib/react-components/markdown';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { acceptApplication, analyzeApplicant, checkoutUrl, getApplicantAnalysis } from '@/lib/api/procurement-analysis';
import type { ApplicationRecord } from '@/lib/api/applications';
import { useToast } from '@/components/ui/toast-provider';
import { Loading } from '@/components/ui/shared';
import { money } from '@/lib/prototype';
import { Action, Panel } from './portal';

function AnalysisResult({ value }: { value: unknown }) {
  if (value == null) return <p className="text-sm text-ink-soft">No analysis has been run yet.</p>;
  if (typeof value === 'string') return <MarkdownMessage content={value} />;
  if (typeof value === 'number' || typeof value === 'boolean') return <span>{String(value)}</span>;
  if (Array.isArray(value)) return <ul className="space-y-3">{value.map((entry, index) => <li key={index} className="rounded-lg border border-line p-3"><AnalysisResult value={entry} /></li>)}</ul>;
  if (typeof value === 'object') {
    const row = value as Record<string, unknown>;
    const report = row.analysis ?? row.report ?? row.result;
    if (report !== undefined) return <AnalysisResult value={report} />;
    return <dl className="space-y-4">{Object.entries(row).map(([key, entry]) => <div key={key}><dt className="mb-1 text-sm font-semibold capitalize">{key.replaceAll('_', ' ')}</dt><dd className="text-sm text-ink-soft"><AnalysisResult value={entry} /></dd></div>)}</dl>;
  }
  return null;
}

export function ApplicationActions({ application }: { application: ApplicationRecord }) {
  const auth = useAuth();
  const client = useQueryClient();
  const toast = useToast();
  const [analyzing, setAnalyzing] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState('');
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const lock = useRef(false);
  const queryKey = ['procureguard', 'analysis', auth.me?.id, application.id];
  const analysis = useQuery({ queryKey, queryFn: () => getApplicantAnalysis(application.id), retry: false });
  async function runAnalysis() {
    if (analyzing) return;
    setAnalyzing(true); setError('');
    try {
      const result = await analyzeApplicant(application.id);
      client.setQueryData(queryKey, result);
      toast('Applicant analysis completed.');
      void analysis.refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not analyze this application.';
      setError(message); toast(message, 'error');
    } finally { setAnalyzing(false); }
  }
  async function accept() {
    if (lock.current) return;
    lock.current = true; setAccepting(true); setError('');
    try {
      const callback = new URL('/payments/callback', window.location.origin);
      callback.searchParams.set('application', application.id);
      const result = await acceptApplication(application.id, callback.href);
      setAccepted(true); setConfirm(false);
      const url = checkoutUrl(result);
      setPaymentUrl(url);
      await client.invalidateQueries({ queryKey: ['procureguard', 'applications'] });
      await client.invalidateQueries({ queryKey: ['procureguard', 'tenders'] });
      if (url) { toast('Checkout is ready. Continue to Paystack to fund escrow.'); }
      else { setError('Application accepted, but the server did not return a supported Paystack checkout URL. Do not submit acceptance again.'); }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not start escrow checkout. Check the application status before retrying.';
      setError(message); toast(message, 'error');
    } finally { setAccepting(false); lock.current = false; }
  }
  const canAccept = ['submitted', 'pending', 'under_review'].includes(application.status.toLowerCase()) && !accepted;
  return <div className="mt-5 space-y-5">
    <Panel title="Procurement analysis" subtitle="Review the applicant’s assessment before making a decision.">
      <Action disabled={analyzing || accepting} onClick={() => void runAnalysis()}>{analyzing ? 'Analyzing applicant…' : analysis.data ? 'Run analysis again' : 'Analyze applicant'}</Action>
      <div className="mt-5">{analysis.isPending ? <Loading /> : analysis.isError ? <p role="alert" className="text-sm text-risk-high">{analysis.error.message} <button className="underline" onClick={() => void analysis.refetch()}>Retry loading analysis</button></p> : <AnalysisResult value={analysis.data} />}</div>
    </Panel>
    <Panel title="Accept & fund escrow" subtitle="Accept this application and continue to Paystack checkout. The vendor can ship once the backend verifies escrow funding.">
      {error && <p role="alert" className="mb-4 text-sm text-risk-high">{error}</p>}
      {paymentUrl ? <a className="inline-flex rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-deep" href={paymentUrl}>Continue to Paystack</a> : <Action disabled={!canAccept || accepting || analyzing} onClick={() => setConfirm(true)}>{accepting ? 'Starting checkout…' : accepted ? 'Application accepted' : 'Accept application'}</Action>}
    </Panel>
    <Dialog open={confirm} onClose={() => { if (!accepting) setConfirm(false); }} aria-labelledby="accept-application-title">
      <DialogTitle id="accept-application-title">Accept this application?</DialogTitle>
      <DialogContent><p>Accept {application.vendorName || 'this vendor'} for {application.title}{application.price === null ? '' : ` at ${money(application.price)}`} and start escrow checkout. Payment is completed on Paystack.</p></DialogContent>
      <DialogActions><Button disabled={accepting} onClick={() => setConfirm(false)}>Cancel</Button><Button variant="contained" disabled={accepting} onClick={() => void accept()}>{accepting ? 'Starting checkout…' : 'Accept & start checkout'}</Button></DialogActions>
    </Dialog>
  </div>;
}
