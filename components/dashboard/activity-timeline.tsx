import { EVENT_LABELS } from '@/lib/constants';
import { formatDateTime } from '@/lib/utils';
import type { DomainEvent } from '@/types';

export function ActivityTimeline({ events }: { events: DomainEvent[] }) {
  return (
    <ol className="flex flex-col gap-4 px-5 py-4">
      {events.map((event) => (
        <li key={event.id} className="flex gap-3">
          <span
            className="mt-1.5 size-2 shrink-0 rounded-full bg-brand"
            aria-hidden
          />
          <div className="min-w-0">
            <p className="text-sm">{event.message}</p>
            <p className="text-xs text-ink-soft">
              {EVENT_LABELS[event.type]} / {formatDateTime(event.at)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
