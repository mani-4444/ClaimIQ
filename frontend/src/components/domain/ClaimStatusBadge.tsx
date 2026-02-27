import { CLAIM_STATUS_MAP } from '../../constants';
import type { ClaimStatus } from '../../types';
import { cn } from '../../lib/utils';

interface ClaimStatusBadgeProps {
  status: ClaimStatus;
  className?: string;
}

export function ClaimStatusBadge({ status, className }: ClaimStatusBadgeProps) {
  const config = CLAIM_STATUS_MAP[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.bgColor,
        config.color,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', config.color.replace('text-', 'bg-'))} />
      {config.label}
    </span>
  );
}
