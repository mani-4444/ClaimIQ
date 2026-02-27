import { create } from "zustand";
import type { User, UserRole } from "../types";
import {
  apiLogin,
  apiRegister,
  apiGetProfile,
  setTokens,
  clearTokens,
  loadTokens,
  getAccessToken,
} from "../lib/api";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    policyType?: string,
  ) => Promise<void>;
  logout: () => void;
  setRole: (role: UserRole) => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const res = await apiLogin(email, password);
      setTokens(res.access_token, res.refresh_token);

      const role: UserRole = email.includes("admin")
        ? "admin"
        : email.includes("adjuster")
          ? "adjuster"
          : "policyholder";

      const user: User = {
        id: res.id,
        email: res.email,
        name: res.name,
        role,
        createdAt: new Date().toISOString(),
      };

      set({ user, isAuthenticated: true, loading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      set({ loading: false, error: message });
      throw err;
    }
  },

  register: async (
    name: string,
    email: string,
    password: string,
    policyType?: string,
  ) => {
    set({ loading: true, error: null });
    try {
      const res = await apiRegister(name, email, password, policyType);
      setTokens(res.access_token, res.refresh_token);

      const user: User = {
        id: res.id,
        email: res.email,
        name: res.name,
        role: "policyholder",
        createdAt: new Date().toISOString(),
      };

      set({ user, isAuthenticated: true, loading: false });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Registration failed";
      set({ loading: false, error: message });
      throw err;
    }
  },

  logout: () => {
    clearTokens();
    set({ user: null, isAuthenticated: false });
  },

  setRole: (role: UserRole) => {
    set((state) => ({
      user: state.user ? { ...state.user, role } : null,
    }));
  },

  hydrate: async () => {
    loadTokens();
    const token = getAccessToken();
    if (!token) return;
    try {
      const profile = await apiGetProfile();
      const email = profile.email || "";
      const role: UserRole = email.includes("admin")
        ? "admin"
        : email.includes("adjuster")
          ? "adjuster"
          : "policyholder";

      set({
        user: {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role,
          policyType: profile.policy_type,
          createdAt: profile.created_at || new Date().toISOString(),
        },
        isAuthenticated: true,
      });
    } catch {
      clearTokens();
      set({ user: null, isAuthenticated: false });
    }
  },
}));
