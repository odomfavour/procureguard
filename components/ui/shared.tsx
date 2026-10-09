'use client';
import type { ReactNode } from 'react';
import { AppSkeleton } from '@msflib/react-components/skeleton';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-ink-soft">{description}</p>
        )}
      </div>
      {action}
    </header>
  );
}
export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-6 rounded-lg border border-line bg-surface p-5">
      <h2 className="mb-5 font-display text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}
export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-brand-tint px-2.5 py-1 text-xs font-medium text-brand">
      {children}
    </span>
  );
}
export function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <article className="rounded-lg border border-line bg-surface p-5">
      <p className="text-sm text-ink-soft">{label}</p>
      <strong className="text-2xl">{value}</strong>
    </article>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-line p-6 text-center text-sm text-ink-soft">
      {children}
    </p>
  );
}
export function ErrorState({ message }: { message: string }) {
  return message ? (
    <p
      role="alert"
      className="my-4 rounded-md bg-risk-high-bg p-3 text-sm text-risk-high"
    >
      {message}
    </p>
  ) : null;
}
export function Loading() {
  return (
    <AppSkeleton>
      <AppSkeleton.Text lines={3} />
      <AppSkeleton.Button />
    </AppSkeleton>
  );
}
export function Confirm({
  open,
  title,
  children,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm}>Confirm</Button>
      </DialogActions>
    </Dialog>
  );
}
export function TimelineItem({
  label,
  complete,
}: {
  label: string;
  complete: boolean;
}) {
  return (
    <li className="my-2 text-sm">
      {complete ? '✓' : '○'} {label}
    </li>
  );
}
