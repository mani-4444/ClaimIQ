import { CLAIM_STATUS_MAP } from "../../constants";
import type { ClaimStatus } from "../../types";
import { cn } from "../../lib/utils";

interface ClaimStatusBadgeProps {
  status: ClaimStatus;
  className?: string;
}

const darkStatusColors: Record<
  ClaimStatus,
  { bg: string; text: string; dot: string }
> = {
  uploaded: { bg: "bg-blue-500/15", text: "text-blue-400", dot: "bg-blue-400" },
  processing: {
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    dot: "bg-amber-400",
  },
  processed: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  error: { bg: "bg-red-500/15", text: "text-red-400", dot: "bg-red-400" },
};

export function ClaimStatusBadge({ status, className }: ClaimStatusBadgeProps) {
  const config = CLAIM_STATUS_MAP[status];
  const colors = darkStatusColors[status] ?? darkStatusColors.uploaded;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border",
        colors.bg,
        colors.text,
        "border-current/20",
        status === "processed" && "animate-pulse-success",
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />
      {config?.label ?? status}
    </span>
  );
}
