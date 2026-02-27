import { CLAIM_STATUS_MAP } from '../../constants';
import { cn, formatDate } from '../../lib/utils';
import type { TimelineEvent } from '../../types';

interface ClaimTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function ClaimTimeline({ events, className }: ClaimTimelineProps) {
  return (
    <div className={cn('relative', className)}>
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

      <ul className="space-y-6">
        {events.map((event, index) => {
          const statusConfig = CLAIM_STATUS_MAP[event.status];
          const isFirst = index === 0;

          return (
            <li key={event.id} className="relative pl-10">
              <div
                className={cn(
                  'absolute left-2.5 top-1 h-3 w-3 rounded-full border-2 border-white',
                  isFirst ? 'bg-primary-600 ring-4 ring-primary-100' : statusConfig.bgColor.replace('bg-', 'bg-'),
                )}
              />
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full',
                      statusConfig.bgColor,
                      statusConfig.color,
                    )}
                  >
                    {statusConfig.label}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDate(event.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{event.description}</p>
                {event.author && (
                  <p className="text-xs text-gray-400 mt-0.5">by {event.author}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
