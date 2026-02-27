/**
 * ClaimIQ API Client
 * Connects frontend to the FastAPI backend at /api/v1/
 */

const API_BASE = "/api/v1";

// ---------- token helpers ----------
let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshInFlight: Promise<boolean> | null = null;

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem("claimiq_access_token", access);
  localStorage.setItem("claimiq_refresh_token", refresh);
}

export function loadTokens() {
  accessToken = localStorage.getItem("claimiq_access_token");
  refreshToken = localStorage.getItem("claimiq_refresh_token");
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem("claimiq_access_token");
  localStorage.removeItem("claimiq_refresh_token");
}

export function getAccessToken() {
  if (!accessToken) loadTokens();
  return accessToken;
}

function getRefreshToken() {
  if (!refreshToken) loadTokens();
  return refreshToken;
}

// ---------- generic fetch wrapper ----------
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) ?? {}),
  };

  // Don't set Content-Type for FormData (browser sets multipart boundary)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401 && getRefreshToken()) {
    // Try to refresh
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${accessToken}`;
      const retry = await fetch(url, { ...options, headers });
      if (!retry.ok) {
        const err = await retry
          .json()
          .catch(() => ({ detail: retry.statusText }));
        throw new ApiError(retry.status, err.detail || "Request failed");
      }
      if (retry.status === 204) return undefined as T;
      return retry.json();
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, err.detail || "Request failed");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ---------- Auth ----------
export interface AuthResponse {
  id: string;
  name: string;
  email: string;
  access_token: string;
  refresh_token: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  policy_type?: string;
  created_at?: string;
}

export async function apiRegister(
  name: string,
  email: string,
  password: string,
  policyType?: string,
): Promise<AuthResponse> {
  const body: Record<string, string> = { name, email, password };
  if (policyType) body.policy_type = policyType;
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function apiLogin(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const currentRefreshToken = getRefreshToken();
    if (!currentRefreshToken) return false;

    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: currentRefreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      accessToken = data.access_token;
      localStorage.setItem("claimiq_access_token", data.access_token);
      return true;
    } catch {
      return false;
    }
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

export async function apiGetProfile(): Promise<UserProfile> {
  return request<UserProfile>("/auth/me");
}

// ---------- Claims ----------
export interface DamageZone {
  zone: string;
  severity: string;
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

export interface ClaimResponse {
  id: string;
  user_id: string;
  image_urls: string[];
  user_description?: string;
  policy_number: string;
  vehicle_company?: string;
  vehicle_model?: string;
  status: string; // uploaded | processing | processed | error
  damage_zones?: DamageZone[];
  damage_severity_score?: number;
  ai_explanation?: string;
  cost_breakdown?: CostBreakdown[];
  cost_total?: number;
  fraud_score?: number;
  fraud_flags?: string[];
  decision?: string; // pending | pre_approved | manual_review | rejected
  decision_confidence?: number;
  risk_level?: string; // low | medium | high
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

export interface ClaimProcessResponse extends ClaimResponse {
  processing_time_ms: number;
}

export interface VehicleOptionsResponse {
  companies: string[];
  models_by_company: Record<string, string[]>;
}

export async function apiCreateClaim(
  images: File[],
  policyNumber: string,
  vehicleCompany?: string,
  vehicleModel?: string,
  description?: string,
  incidentDate?: string,
  location?: string,
  coverageLimit?: number,
  deductible?: number,
  depreciationPct?: number,
  policyValidTill?: string,
): Promise<ClaimResponse> {
  const formData = new FormData();
  images.forEach((img) => formData.append("images", img));
  formData.append("policy_number", policyNumber);
  if (vehicleCompany) formData.append("vehicle_company", vehicleCompany);
  if (vehicleModel) formData.append("vehicle_model", vehicleModel);
  if (description) formData.append("user_description", description);
  if (incidentDate) formData.append("incident_date", incidentDate);
  if (location) formData.append("location", location);
  if (coverageLimit != null)
    formData.append("coverage_limit", String(coverageLimit));
  if (deductible != null) formData.append("deductible", String(deductible));
  if (depreciationPct != null)
    formData.append("depreciation_pct", String(depreciationPct));
  if (policyValidTill) formData.append("policy_valid_till", policyValidTill);
  return request<ClaimResponse>("/claims", { method: "POST", body: formData });
}

export async function apiListClaims(): Promise<ClaimResponse[]> {
  return request<ClaimResponse[]>("/claims");
}

export async function apiGetVehicleOptions(): Promise<VehicleOptionsResponse> {
  return request<VehicleOptionsResponse>("/claims/vehicle-options");
}

export async function apiGetClaim(claimId: string): Promise<ClaimResponse> {
  return request<ClaimResponse>(`/claims/${claimId}`);
}

export async function apiProcessClaim(
  claimId: string,
): Promise<ClaimProcessResponse> {
  return request<ClaimProcessResponse>(`/claims/${claimId}/process`, {
    method: "POST",
  });
}

export async function apiDeleteClaim(claimId: string): Promise<void> {
  return request<void>(`/claims/${claimId}`, { method: "DELETE" });
}

export function getReportDownloadUrl(claimId: string): string {
  return `${API_BASE}/claims/${claimId}/report`;
}

export async function apiDownloadReport(claimId: string): Promise<Blob> {
  const url = getReportDownloadUrl(claimId);
  const headers: Record<string, string> = {};
  const token = getAccessToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new ApiError(res.status, "Download failed");
  return res.blob();
}
