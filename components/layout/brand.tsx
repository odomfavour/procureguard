import { ShieldCheck } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function Brand({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="grid size-8 place-items-center rounded-md bg-brand text-white">
        <ShieldCheck className="size-[18px]" aria-hidden />
      </span>
      <span className="font-display text-lg font-semibold tracking-tight">
        {APP_NAME}
      </span>
    </div>
  );
}
