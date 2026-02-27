import { create } from 'zustand';
import type { User, UserRole } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, _password: string) => void;
  logout: () => void;
  setRole: (role: UserRole) => void;
}

// Mock login for demo — replace with real API calls
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  login: (email: string, _password: string) => {
    const role: UserRole = email.includes('admin')
      ? 'admin'
      : email.includes('adjuster')
        ? 'adjuster'
        : 'policyholder';

    const mockUser: User = {
      id: '1',
      email,
      firstName: 'John',
      lastName: 'Doe',
      role,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    set({ user: mockUser, isAuthenticated: true });
  },

  logout: () => {
    set({ user: null, isAuthenticated: false });
  },

  setRole: (role: UserRole) => {
    set((state) => ({
      user: state.user ? { ...state.user, role } : null,
    }));
  },
}));
