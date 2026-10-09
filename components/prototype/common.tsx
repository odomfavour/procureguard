'use client';
import { useMemo, useSyncExternalStore } from 'react';
import { readDB, saveDB, type DB, snapshot } from '@/lib/prototype';
function subscribe(callback: () => void) {
  window.addEventListener('pg-updated', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('pg-updated', callback);
    window.removeEventListener('storage', callback);
  };
}
export function useData() {
  const state = useSyncExternalStore(subscribe, snapshot, () => null);
  const db = useMemo(() => (state === null ? null : readDB()), [state]);
  function update(fn: (d: DB) => void) {
    const d = readDB();
    fn(d);
    saveDB(d);
  }
  return { db, update };
}
export const btn =
  'inline-flex rounded-lg border border-line px-4 py-2 text-sm font-medium hover:bg-paper';
export const select =
  'w-full rounded-lg border border-line bg-white px-3 py-2.5';
export const docs = [
  'CAC Certificate',
  'CAC Status Report',
  'Tax Registration Evidence',
  'Company Profile',
  'Product / Service Catalogue',
  'Quotation',
  'Proforma Invoice',
  'Technical Proposal',
  'Warranty Document',
  'Industry Licence',
  'Professional Certificate',
  'Bank Details',
];
