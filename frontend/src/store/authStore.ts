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
  hydrated: boolean;
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
  hydrated: false,
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

      set({ user, isAuthenticated: true, hydrated: true, loading: false });
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

      set({ user, isAuthenticated: true, hydrated: true, loading: false });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Registration failed";
      set({ loading: false, error: message });
      throw err;
    }
  },

  logout: () => {
    clearTokens();
    set({ user: null, isAuthenticated: false, hydrated: true, error: null });
  },

  setRole: (role: UserRole) => {
    set((state) => ({
      user: state.user ? { ...state.user, role } : null,
    }));
  },

  hydrate: async () => {
    set({ loading: true });
    loadTokens();
    const token = getAccessToken();
    if (!token) {
      set({ user: null, isAuthenticated: false, hydrated: true, loading: false });
      return;
    }

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
        hydrated: true,
        loading: false,
        error: null,
      });
    } catch (err: unknown) {
      const status =
        typeof err === "object" && err !== null && "status" in err
          ? Number((err as { status?: unknown }).status)
          : undefined;

      if (status === 401 || status === 403) {
        clearTokens();
        set({ user: null, isAuthenticated: false, hydrated: true, loading: false });
      } else {
        set({ hydrated: true, loading: false });
      }
    }
  },
}));
