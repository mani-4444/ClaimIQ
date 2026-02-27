import type { ClaimStatus } from '../types';

export const CLAIM_STATUS_MAP: Record<
  ClaimStatus,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  DRAFT: {
    label: 'Draft',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: 'FileEdit',
  },
  SUBMITTED: {
    label: 'Submitted',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: 'Send',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: 'Search',
  },
  INFO_NEEDED: {
    label: 'Info Needed',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    icon: 'AlertCircle',
  },
  APPROVED: {
    label: 'Approved',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: 'CheckCircle',
  },
  DENIED: {
    label: 'Denied',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: 'XCircle',
  },
  FLAGGED: {
    label: 'Flagged',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    icon: 'Flag',
  },
  CLOSED: {
    label: 'Closed',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: 'Archive',
  },
};

export const CLAIM_TYPES = [
  { value: 'auto', label: 'Auto' },
  { value: 'home', label: 'Home' },
  { value: 'health', label: 'Health' },
  { value: 'life', label: 'Life' },
  { value: 'property', label: 'Property' },
  { value: 'liability', label: 'Liability' },
] as const;

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
