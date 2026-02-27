import { Avatar } from '../ui/Avatar';
import { formatRelativeTime } from '../../lib/utils';
import { cn } from '../../lib/utils';
import type { ClaimNote } from '../../types';

interface ActivityFeedProps {
  notes: ClaimNote[];
  className?: string;
}

export function ActivityFeed({ notes, className }: ActivityFeedProps) {
  if (notes.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4 text-center">
        No activity yet for this claim.
      </p>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {notes.map((note) => (
        <div key={note.id} className="flex gap-3">
          <Avatar name={note.author} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-medium text-gray-900">{note.author}</span>
              <span className="text-xs text-gray-400 capitalize">({note.authorRole})</span>
              <span className="text-xs text-gray-400">
                {formatRelativeTime(note.createdAt)}
              </span>
            </div>
            <p className="text-sm text-gray-600">{note.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
