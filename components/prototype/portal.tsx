'use client';
import Link from 'next/link';
import { useData } from './common';
import { Loading } from '@/components/ui/shared';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LogOut,
  LayoutDashboard,
  FilePlus,
  ClipboardList,
  Wallet,
  Package,
  FolderOpen,
  Bell,
} from 'lucide-react';
import { session, logout } from '@/lib/prototype';
export function Portal({
  children,
  role,
}: {
  children: React.ReactNode;
  role: 'buyer' | 'vendor';
}) {
  const router = useRouter();
  const path = usePathname();
  const { db } = useData();
  const account = db?.accounts.find((a) => a.id === session()) || null;
  useEffect(() => {
    if (db && (!account || account.role !== role)) router.replace('/login');
  }, [db, account, role, router]);
  if (!account || account.role !== role)
    return (
      <div className="p-12 text-center text-ink-soft">
        <Loading />
      </div>
    );
  const links =
    role === 'buyer'
      ? ([
          ['/dashboard', 'Overview', LayoutDashboard],
          ['/tenders', 'Tenders', ClipboardList],
          ['/tenders/new', 'Create tender', FilePlus],
          ['/orders', 'Orders & escrow', Wallet],
        ] as const)
      : ([
          ['/vendor/dashboard', 'Overview', LayoutDashboard],
          ['/vendor/tenders', 'Browse tenders', ClipboardList],
          ['/vendor/applications', 'My applications', FilePlus],
          ['/vendor/documents', 'Document vault', FolderOpen],
          ['/vendor/orders', 'Orders & payouts', Package],
        ] as const);
  return (
    <div className="min-h-screen bg-paper lg:flex">
      <aside className="bg-[#101e42] text-white lg:w-64 shrink-0">
        <div className="p-6 text-xl font-bold tracking-tight">
          ◈ ProcureGuard
        </div>
        <div className="px-6 pb-5 text-xs text-blue-200">
          {role === 'buyer' ? 'BUYER WORKSPACE' : 'VENDOR WORKSPACE'}
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col">
          {links.map(([href, label, Icon]) => (
            <Link
              key={href}
              href={href}
              className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-3 text-sm ${path === href ? 'bg-white/15 text-white' : 'text-blue-100 hover:bg-white/10'}`}
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white px-5 py-4 sm:px-8">
          <div>
            <div className="font-semibold">{account.organization}</div>
            <div className="text-xs text-ink-soft">
              {account.name} · {role}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href={
                role === 'buyer' ? '/notifications' : '/vendor/notifications'
              }
              aria-label="Notifications"
            >
              <Bell size={19} />
            </Link>
            <button
              className="flex items-center gap-2 text-sm text-ink-soft"
              onClick={() => {
                logout();
                router.push('/login');
              }}
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </header>
        <div className="border-b border-line bg-brand-tint px-5 py-2 text-xs text-brand sm:px-8">
          Demo workspace · Local browser data · AI, document verification and
          escrow are simulated.{' '}
          <Link href="/workspace" className="underline">
            Connect live MSFLib →
          </Link>
        </div>
        <main className="mx-auto max-w-6xl p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
export function Panel({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className="rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
      {title && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
export function Action({
  children,
  onClick,
  disabled,
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
export function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  placeholder,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        required={required}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2.5 outline-none focus:border-brand"
      />
    </label>
  );
}
export function Heading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-ink-soft">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
