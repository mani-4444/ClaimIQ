import { create } from "zustand";
import type { Claim } from "../types";
import {
  apiListClaims,
  apiGetClaim,
  apiCreateClaim,
  apiProcessClaim,
  apiDeleteClaim,
  type ClaimResponse,
} from "../lib/api";

/** Map API response → frontend Claim type */
function toClaim(c: ClaimResponse): Claim {
  return {
    id: c.id,
    user_id: c.user_id,
    image_urls: c.image_urls,
    user_description: c.user_description,
    policy_number: c.policy_number,
    vehicle_company: c.vehicle_company,
    vehicle_model: c.vehicle_model,
    status: c.status as Claim["status"],
    damage_zones: c.damage_zones as Claim["damage_zones"],
    damage_severity_score: c.damage_severity_score,
    ai_explanation: c.ai_explanation,
    cost_breakdown: c.cost_breakdown as Claim["cost_breakdown"],
    cost_total: c.cost_total,
    fraud_score: c.fraud_score,
    fraud_flags: c.fraud_flags,
    decision: c.decision as Claim["decision"],
    decision_confidence: c.decision_confidence,
    risk_level: c.risk_level as Claim["risk_level"],
    created_at: c.created_at,
    processed_at: c.processed_at,
  };
}

interface ClaimsState {
  claims: Claim[];
  current: Claim | null;
  loading: boolean;
  processing: boolean;
  error: string | null;
  fetchClaims: () => Promise<void>;
  fetchClaim: (id: string) => Promise<void>;
  createClaim: (
    images: File[],
    policyNumber: string,
    vehicleCompany?: string,
    vehicleModel?: string,
    description?: string,
    incidentDate?: string,
    location?: string,
  ) => Promise<Claim>;
  processClaim: (id: string) => Promise<Claim>;
  deleteClaim: (id: string) => Promise<void>;
  clearCurrent: () => void;
}

export const useClaimsStore = create<ClaimsState>((set) => ({
  claims: [],
  current: null,
  loading: false,
  processing: false,
  error: null,

  fetchClaims: async () => {
    set({ loading: true, error: null });
    try {
      const res = await apiListClaims();
      set({ claims: res.map(toClaim), loading: false });
    } catch (err: unknown) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Failed to fetch claims",
      });
    }
  },

  fetchClaim: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const res = await apiGetClaim(id);
      set({ current: toClaim(res), loading: false });
    } catch (err: unknown) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Failed to fetch claim",
      });
    }
  },

  createClaim: async (
    images,
    policyNumber,
    vehicleCompany,
    vehicleModel,
    description,
    incidentDate,
    location,
  ) => {
    set({ loading: true, error: null });
    try {
      const res = await apiCreateClaim(
        images,
        policyNumber,
        vehicleCompany,
        vehicleModel,
        description,
        incidentDate,
        location,
      );
      const claim = toClaim(res);
      set((state) => ({ claims: [claim, ...state.claims], loading: false }));
      return claim;
    } catch (err: unknown) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Failed to create claim",
      });
      throw err;
    }
  },

  processClaim: async (id: string) => {
    set({ processing: true, error: null });
    try {
      const res = await apiProcessClaim(id);
      const claim = toClaim(res);
      set((state) => ({
        current: claim,
        claims: state.claims.map((c) => (c.id === id ? claim : c)),
        processing: false,
      }));
      return claim;
    } catch (err: unknown) {
      set({
        processing: false,
        error: err instanceof Error ? err.message : "Processing failed",
      });
      throw err;
    }
  },

  deleteClaim: async (id: string) => {
    try {
      await apiDeleteClaim(id);
      set((state) => ({
        claims: state.claims.filter((c) => c.id !== id),
        current: state.current?.id === id ? null : state.current,
      }));
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : "Delete failed" });
      throw err;
    }
  },

  clearCurrent: () => set({ current: null }),
}));
