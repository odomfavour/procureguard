import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
  meta?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  back,
  actions,
  meta,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-2">
        {back && (
          <Link
            href={back.href}
            className="inline-flex w-fit items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            {back.label}
          </Link>
        )}
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-sm text-ink-soft">{description}</p>
        )}
        {meta}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
      )}
    </div>
  );
}
