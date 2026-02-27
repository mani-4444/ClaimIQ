export type UserRole = "policyholder" | "adjuster" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  policyType?: string;
  createdAt: string;
}

/** Backend claim statuses */
export type ClaimStatus = "uploaded" | "processing" | "processed" | "error";

/** Backend AI decision */
export type ClaimDecision =
  | "pending"
  | "pre_approved"
  | "manual_review"
  | "rejected";

/** Risk levels from backend */
export type RiskLevel = "low" | "medium" | "high";

/** Vehicle damage zones */
export type VehicleZone = "Front" | "Rear" | "Left Side" | "Right Side";

export interface DamageZone {
  zone: VehicleZone;
  severity: "minor" | "moderate" | "severe";
  damage_type?: string;
  confidence: number;
  bounding_box: number[];
}

export interface CostBreakdown {
  zone: string;
  damage_type?: string;
  severity: string;
  quantity?: number;
  unit_repair_cost?: number;
  base_cost: number;
  labor_cost: number;
  regional_multiplier: number;
  total: number;
}

export interface Claim {
  id: string;
  user_id: string;
  image_urls: string[];
  user_description?: string;
  policy_number: string;
  vehicle_company?: string;
  vehicle_model?: string;
  status: ClaimStatus;
  damage_zones?: DamageZone[];
  damage_severity_score?: number;
  ai_explanation?: string;
  cost_breakdown?: CostBreakdown[];
  cost_total?: number;
  fraud_score?: number;
  fraud_flags?: string[];
  decision?: ClaimDecision;
  decision_confidence?: number;
  risk_level?: RiskLevel;
  repair_replace_recommendation?: {
    action: string;
    severity_score: number;
    repair_cost: number;
    replace_cost: number;
    reason: string;
  };
  manual_review_required?: boolean;
  manual_review_reason?: string;
  repair_time_estimate?: {
    min_days: number;
    max_days: number;
    label: string;
  };
  coverage_summary?: {
    gross_total: number;
    depreciation_pct: number;
    depreciated_total: number;
    deductible: number;
    coverage_limit: number;
    insurance_pays: number;
    customer_pays: number;
    policy_active: boolean;
    policy_valid_till?: string;
  };
  garage_recommendations?: Array<{
    garage_id: string;
    name: string;
    location: string;
    specialization: string[];
    rating: number;
    avg_turnaround_days: number;
  }>;
  fraud_signal_breakdown?: {
    reuse_score?: number | null;
    ai_gen_score?: number | null;
    metadata_anomaly?: number | null;
    avg_confidence?: number | null;
  };
  created_at: string;
  processed_at?: string;
}

export interface DashboardStats {
  totalClaims: number;
  pendingClaims: number;
  processedClaims: number;
  preApproved: number;
  manualReview: number;
  rejected: number;
  totalCost: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
  link?: string;
}
