import { cn } from "../../lib/utils";

interface ActivityFeedProps {
  notes?: { id: string; author: string; content: string; createdAt: string }[];
  className?: string;
}

export function ActivityFeed({ notes = [], className }: ActivityFeedProps) {
  if (notes.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4 text-center">
        No activity yet for this claim.
      </p>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {notes.map((note) => (
        <div key={note.id} className="flex gap-3">
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-gray-200">
              {note.author}
            </span>
            <p className="text-sm text-gray-400">{note.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
