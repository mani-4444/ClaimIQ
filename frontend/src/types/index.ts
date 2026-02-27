export type UserRole = 'policyholder' | 'adjuster' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  isActive: boolean;
}

export type ClaimStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'INFO_NEEDED'
  | 'APPROVED'
  | 'DENIED'
  | 'FLAGGED'
  | 'CLOSED';

export type ClaimType = 'auto' | 'home' | 'health' | 'life' | 'property' | 'liability';

export interface Claim {
  id: string;
  claimNumber: string;
  type: ClaimType;
  status: ClaimStatus;
  title: string;
  description: string;
  amount: number;
  policyNumber: string;
  policyholderName: string;
  submittedAt: string;
  updatedAt: string;
  assignedTo?: string;
  riskScore?: number;
  documents: ClaimDocument[];
  notes: ClaimNote[];
  timeline: TimelineEvent[];
}

export interface ClaimDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface ClaimNote {
  id: string;
  author: string;
  authorRole: UserRole;
  content: string;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  status: ClaimStatus;
  description: string;
  timestamp: string;
  author?: string;
}

export interface DashboardStats {
  totalClaims: number;
  pendingClaims: number;
  approvedClaims: number;
  deniedClaims: number;
  flaggedClaims: number;
  averageProcessingTime: number;
  totalAmount: number;
  trend: {
    totalClaims: number;
    approvedClaims: number;
    deniedClaims: number;
  };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  link?: string;
}
