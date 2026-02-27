import { cn } from "../../lib/utils";

interface TimelineEntry {
  id: string;
  label: string;
  timestamp: string;
  description?: string;
}

interface ClaimTimelineProps {
  events?: TimelineEntry[];
  className?: string;
}

export function ClaimTimeline({ events = [], className }: ClaimTimelineProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4 text-center">
        No timeline events.
      </p>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/[0.06]" />
      <ul className="space-y-6">
        {events.map((event, index) => (
          <li key={event.id} className="relative pl-10">
            <div
              className={cn(
                "absolute left-2.5 top-1 h-3 w-3 rounded-full border-2 border-dark-700",
                index === 0
                  ? "bg-primary-500 ring-4 ring-primary-500/20"
                  : "bg-dark-500",
              )}
            />
            <div>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-gray-300">
                {event.label}
              </span>
              {event.description && (
                <p className="text-sm text-gray-300 mt-1">
                  {event.description}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
