interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <p className="font-display text-base font-semibold">{title}</p>
      <p className="max-w-sm text-sm text-ink-soft">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
