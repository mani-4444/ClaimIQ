import type { ClaimStatus, ClaimDecision } from "../types";

// ---- Claim status display ----
export const CLAIM_STATUS_MAP: Record<
  ClaimStatus,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  uploaded: {
    label: "Uploaded",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    icon: "Upload",
  },
  processing: {
    label: "Processing",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
    icon: "Loader",
  },
  processed: {
    label: "Processed",
    color: "text-green-700",
    bgColor: "bg-green-100",
    icon: "CheckCircle",
  },
  error: {
    label: "Error",
    color: "text-red-700",
    bgColor: "bg-red-100",
    icon: "AlertCircle",
  },
};

// ---- Decision display ----
export const DECISION_MAP: Record<
  ClaimDecision,
  {
    label: string;
    color: string;
    bgColor: string;
    icon: string;
    variant: string;
  }
> = {
  pending: {
    label: "Pending",
    color: "text-gray-400",
    bgColor: "bg-gray-500/15",
    icon: "Clock",
    variant: "neutral",
  },
  pre_approved: {
    label: "Pre-Approved",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/15",
    icon: "CheckCircle",
    variant: "success",
  },
  manual_review: {
    label: "Manual Review",
    color: "text-amber-400",
    bgColor: "bg-amber-500/15",
    icon: "AlertTriangle",
    variant: "warning",
  },
  rejected: {
    label: "Rejected",
    color: "text-red-400",
    bgColor: "bg-red-500/15",
    icon: "XCircle",
    variant: "danger",
  },
};

// ---- Vehicle zones ----
export const VEHICLE_ZONES = [
  { value: "Front", label: "Front" },
  { value: "Rear", label: "Rear" },
  { value: "Left Side", label: "Left Side" },
  { value: "Right Side", label: "Right Side" },
] as const;

// ---- Severity ----
export const SEVERITY_MAP: Record<string, { label: string; color: string }> = {
  minor: { label: "Minor", color: "text-yellow-400" },
  moderate: { label: "Moderate", color: "text-orange-400" },
  severe: { label: "Severe", color: "text-red-400" },
};

export const UI_PERMISSIONS = {
  policyholder: {
    canCreateClaim: true,
    canEditOwnClaim: true,
    canViewOtherClaims: false,
    canApproveDeny: false,
    canViewRiskScore: false,
    canAccessAnalytics: false,
    canManageUsers: false,
  },
  adjuster: {
    canCreateClaim: false,
    canEditOwnClaim: false,
    canViewOtherClaims: true,
    canApproveDeny: true,
    canViewRiskScore: true,
    canAccessAnalytics: true,
    canManageUsers: false,
  },
  admin: {
    canCreateClaim: false,
    canEditOwnClaim: false,
    canViewOtherClaims: true,
    canApproveDeny: true,
    canViewRiskScore: true,
    canAccessAnalytics: true,
    canManageUsers: true,
  },
} as const;

export const ITEMS_PER_PAGE_OPTIONS = [25, 50, 100] as const;
