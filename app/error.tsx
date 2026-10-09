'use client';
import { PageState } from '@/components/ui/page-state';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageState fullPage onRetry={reset} />;
}
