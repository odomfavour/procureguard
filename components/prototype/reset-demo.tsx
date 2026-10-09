'use client';
import { useRouter } from 'next/navigation';
import { saveDB, seed } from '@/lib/prototype';
export function ResetDemo() {
  const router = useRouter();
  return (
    <button
      className="rounded-lg border border-line px-3 py-2 text-xs"
      onClick={() => {
        if (confirm('Reset all prototype changes?')) {
          saveDB(structuredClone(seed));
          router.push('/login');
        }
      }}
    >
      Reset demo data
    </button>
  );
}
