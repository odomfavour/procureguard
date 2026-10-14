'use client';
import { useRef, useState, useSyncExternalStore } from 'react';
import { useAuth } from '@msflib/react-auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button } from '@mui/material';
import FormBuilder, { type LayoutProps } from '@/components/msflib/form-builder';
import { DataTable } from '@/components/msflib/data-table';
import { field, submit } from '@/components/ui/fields';
import { Loading } from '@/components/ui/shared';
import { PageLoader } from '@/components/ui/page-loader';
import { PageState } from '@/components/ui/page-state';
import { useToast } from '@/components/ui/toast-provider';
import { getWallet, listWithdrawals, createWithdrawal, validateWithdrawal } from '@/lib/api/wallet';
import type { WithdrawalInput } from '@/types/api/wallet';
import { formatDate } from '@/utils/format-date';
import { Portal, Heading, Panel } from './portal';

const emptyForm = { amount: '', bank_name: '', account_name: '', account_number: '' };
const elements = [field('amount', 'Amount'), field('bank_name', 'Bank name'), field('account_name', 'Account name'), field('account_number', 'Account number'), submit('Withdraw funds')];

function WithdrawalLayout({ FormField }: LayoutProps) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <FormField elementName="amount" />
    <FormField elementName="bank_name" />
    <FormField elementName="account_name" />
    <FormField elementName="account_number" />
    <div className="sm:col-span-2 sm:flex sm:justify-end">
      <FormField elementName="submit" />
    </div>
  </div>;
}

const subscribeToHydration = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function VendorWallet() {
  const auth = useAuth();
  // Browser-backed auth can differ from SSR. Use the same initial UI on both.
  const hydrated = useSyncExternalStore(subscribeToHydration, clientSnapshot, serverSnapshot);
  const vendor = auth.me?.data?.account_type === 'vendor' || auth.me?.role === 'vendor';
  if (!hydrated || auth.status === 'loading') return <PageLoader label="Opening your wallet…" />;
  if (auth.status !== 'authenticated' || !vendor) return <PageState title="Sign in as a vendor to view your wallet" backHref="/login" backLabel="Sign in" />;
  return <WalletContent key={String(auth.me?.id)} accountId={String(auth.me?.id)} />;
}

function WalletContent({ accountId }: { accountId: string }) {
  const client = useQueryClient();
  const toast = useToast();
  const wallet = useQuery({ queryKey: ['procureguard', 'wallet', accountId], queryFn: getWallet });
  const history = useQuery({ queryKey: ['procureguard', 'wallet', accountId, 'withdrawals'], queryFn: listWithdrawals });
  const [data, setData] = useState<Record<string, unknown>>({ ...emptyForm });
  const [review, setReview] = useState<WithdrawalInput | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const lock = useRef(false);
  const needsRefresh = useRef(false);
  const formatMoney = (value: string) => wallet.data ? new Intl.NumberFormat('en-NG', { style: 'currency', currency: wallet.data.currency }).format(Number(value)) : value;
  function prepare(values: Record<string, unknown>) {
    if (lock.current || needsRefresh.current) return;
    setError(''); setMessage('');
    try {
      if (!wallet.data || wallet.isError) throw new Error('Refresh your available wallet balance before withdrawing.');
      const input = Object.fromEntries(Object.keys(emptyForm).map(key => [key, String(values[key] ?? '')])) as WithdrawalInput;
      setReview(validateWithdrawal(input, wallet.data.availableBalance));
    } catch (err) { setError(err instanceof Error ? err.message : 'Check your withdrawal details.'); }
  }
  async function confirm() {
    if (lock.current || !review || needsRefresh.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      if (!wallet.data || wallet.isError) throw new Error('Available balance is unavailable. Refresh before withdrawing.');
      await createWithdrawal(validateWithdrawal(review, wallet.data.availableBalance));
    } catch (err) {
      setError(`${err instanceof Error ? err.message : 'Could not confirm withdrawal.'} Refresh withdrawal history before trying again.`);
      needsRefresh.current = true;
      setUncertain(true); setReview(null); setBusy(false); lock.current = false;
      return;
    }
    setReview(null); setData({ ...emptyForm }); setMessage('Withdrawal request submitted.'); toast('Withdrawal request submitted.');
    await Promise.allSettled([client.invalidateQueries({ queryKey: ['procureguard', 'wallet', accountId] })]);
    setBusy(false); lock.current = false;
  }
  async function refresh() {
    if (lock.current) return;
    const results = await Promise.all([wallet.refetch(), history.refetch()]);
    if (results.every(result => !result.isError)) { needsRefresh.current = false; setUncertain(false); }
  }
  return <Portal role="vendor">
    <Heading title="Wallet & withdrawals" subtitle="View available funds and request a withdrawal to your bank account." />
    <div className="space-y-5">
      <Panel title="Available balance" subtitle="Funds still held in escrow are not available for withdrawal.">
        {wallet.isPending ? <Loading /> : wallet.isError ? <PageState title="Couldn’t load available balance" onRetry={() => void wallet.refetch()} backHref="/vendor/orders" backLabel="Back to orders" /> : <p className="text-3xl font-bold">{formatMoney(wallet.data.availableBalance)}</p>}
      </Panel>
      <Panel title="Withdraw funds" subtitle="Review your amount and bank details before submitting a withdrawal request.">
        {wallet.data && !wallet.isError && Number(wallet.data.availableBalance) > 0 ? <fieldset disabled={busy || uncertain} className="min-w-0">
          <FormBuilder key={message || 'withdrawal-form'} elements={elements} formData={data} setFormData={setData} onSubmit={prepare} loadingState={busy} layout={WithdrawalLayout} />
        </fieldset> : <p className="text-sm text-ink-soft">Withdrawals become available when your wallet has a confirmed positive available balance.</p>}
        {error && <p role="alert" className="mt-4 text-sm text-risk-high">{error}</p>}
        {message && <p role="status" className="mt-4 text-sm text-risk-low">{message}</p>}
        <Button disabled={busy} onClick={() => void refresh()}>Refresh wallet & history</Button>
      </Panel>
      <Panel title="Withdrawal history">
        {history.isPending ? <Loading /> : history.isError ? <PageState title="Couldn’t load withdrawals" onRetry={() => void history.refetch()} backHref="/vendor/orders" backLabel="Back to orders" /> : <>
          <DataTable title="Withdrawals" rows={history.data} columns={[
            { field: 'amount', headerName: 'Amount', width: 170, renderCell: ({ row }) => formatMoney(row.amount) },
            { field: 'status', headerName: 'Status', width: 160 },
            { field: 'bankName', headerName: 'Bank', minWidth: 160, flex: 1 },
            { field: 'accountNumber', headerName: 'Account', width: 150, renderCell: ({ row }) => row.accountNumber ? `•••• ${row.accountNumber.slice(-4)}` : '—' },
            { field: 'createdAt', headerName: 'Requested', width: 160, renderCell: ({ row }) => formatDate(row.createdAt) },
          ]} />
          {!history.data.length && <p className="py-6 text-center text-sm text-ink-soft">No withdrawals yet.</p>}
        </>}
      </Panel>
    </div>
    <Dialog open={review !== null} onClose={() => { if (!busy) setReview(null); }} aria-labelledby="withdrawal-title" fullWidth maxWidth="sm">
      <DialogTitle id="withdrawal-title">Review withdrawal</DialogTitle>
      <DialogContent>{review && <dl className="space-y-3 text-sm">{[['Amount', formatMoney(review.amount)], ['Bank', review.bank_name], ['Account name', review.account_name], ['Account number', review.account_number]].map(([label, value]) => <div key={label}><dt className="text-ink-soft">{label}</dt><dd className="font-semibold">{value}</dd></div>)}</dl>}<p className="mt-4 text-sm">Submitting requests a withdrawal. Payment completion is shown in your withdrawal history.</p></DialogContent>
      <DialogActions><Button disabled={busy} onClick={() => setReview(null)}>Cancel</Button><Button disabled={busy || !review || uncertain} variant="contained" onClick={confirm}>{busy ? 'Submitting…' : 'Confirm withdrawal'}</Button></DialogActions>
    </Dialog>
  </Portal>;
}
