'use client';
import Link from 'next/link';
import { useAuth } from '@msflib/react-auth';
import { useToast } from '@/components/ui/toast-provider';
import { useData } from './common';
import { PageLoader } from '@/components/ui/page-loader';
import { useEffect, useState } from 'react';
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
  Menu,
  X,
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
  const auth = useAuth();
  const notify = useToast();
  const path = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { db } = useData();
  const isLive = auth.status === 'authenticated';
  const account = isLive ? {
    name: auth.me?.username || auth.me?.email || '',
    organization: String(auth.me?.data?.organization || 'ProcureGuard'),
    role: auth.me?.data?.account_type === 'vendor' || auth.me?.role === 'vendor' ? 'vendor' : role,
  } : db?.accounts.find((a) => a.id === session()) || null;
  useEffect(() => {
    if (auth.status !== 'loading' && db && account?.role !== role) router.replace('/login');
  }, [db, account?.role, role, router, auth.status]);
  if (!account || account.role !== role)
    return (
      <PageLoader label="Opening your dashboard…" />
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
        <div className="flex items-center justify-between p-6">
          <span className="text-xl font-bold tracking-tight">◈ ProcureGuard</span>
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white lg:hidden"
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen}
            aria-controls="workspace-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        <div
          id="workspace-navigation"
          className={`${menuOpen ? 'block' : 'hidden'} lg:block`}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setMenuOpen(false);
              document.querySelector<HTMLButtonElement>('[aria-controls="workspace-navigation"]')?.focus();
            }
          }}
        >
        <div className="px-6 pb-5 text-xs text-blue-200">
          {role === 'buyer' ? 'BUYER WORKSPACE' : 'VENDOR WORKSPACE'}
        </div>
        <nav aria-label="Workspace navigation" className="flex flex-col gap-1 px-3 pb-3">
          {links.map(([href, label, Icon]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-3 text-sm ${path === href ? 'bg-white/15 text-white' : 'text-blue-100 hover:bg-white/10'}`}
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </nav>
        </div>
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
              onClick={async () => {
                if (isLive) {
                  try { await auth.logout(); } catch (error) {
                    notify(error instanceof Error ? error.message : 'Sign out failed.', 'error');
                    return;
                  }
                }
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
          {isLive ? 'Signed in · Live tenders · Applications and orders are not yet connected to the backend.' : <>Demo workspace · Local browser data · AI, document verification and escrow are simulated.</>}
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
