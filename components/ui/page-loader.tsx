import { ShieldCheck } from 'lucide-react';

export function PageLoader({ fullPage = true, label = 'Getting things ready…' }: { fullPage?: boolean; label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={`flex w-full items-center justify-center bg-paper px-6 ${fullPage ? 'min-h-dvh' : 'min-h-64 rounded-xl'}`}
    >
      <div className="flex flex-col items-center text-center">
        <div aria-hidden="true" className="relative mb-6 flex h-20 w-20 items-center justify-center">
          <span className="absolute inset-0 rounded-full border-4 border-brand/10 border-t-brand motion-safe:animate-spin" />
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand shadow-sm ring-1 ring-line">
            <ShieldCheck size={28} strokeWidth={1.7} />
          </span>
        </div>
        <p className="font-display text-xl font-bold tracking-tight text-ink">ProcureGuard</p>
        <p className="mt-2 text-sm text-ink-soft">{label}</p>
        <span aria-hidden="true" className="mt-5 h-1 w-12 rounded-full bg-brand/20 motion-safe:animate-pulse" />
      </div>
    </div>
  );
}
