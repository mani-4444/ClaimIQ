import { CLAIM_STATUS_MAP } from '../../constants';
import type { ClaimStatus } from '../../types';
import { cn } from '../../lib/utils';

interface ClaimStatusBadgeProps {
  status: ClaimStatus;
  className?: string;
}

// Dark theme color map for status badges
const darkStatusColors: Record<ClaimStatus, { bg: string; text: string; dot: string }> = {
  DRAFT: { bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400' },
  SUBMITTED: { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400' },
  UNDER_REVIEW: { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400' },
  INFO_NEEDED: { bg: 'bg-orange-500/15', text: 'text-orange-400', dot: 'bg-orange-400' },
  APPROVED: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  DENIED: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
  FLAGGED: { bg: 'bg-orange-500/15', text: 'text-orange-400', dot: 'bg-orange-400' },
  CLOSED: { bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400' },
};

export function ClaimStatusBadge({ status, className }: ClaimStatusBadgeProps) {
  const config = CLAIM_STATUS_MAP[status];
  const colors = darkStatusColors[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border',
        colors.bg,
        colors.text,
        `border-current/20`,
        status === 'APPROVED' && 'animate-pulse-success',
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', colors.dot)} />
      {config.label}
    </span>
  );
}
