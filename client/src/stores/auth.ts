import { create } from 'zustand';
import type { User } from '../lib/types';
import { testLogin as apiTestLogin, getMe, logout as apiLogout } from '../lib/api';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (mockUserId: string) => Promise<void>;
  fetchMe: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  login: async (mockUserId: string) => {
    const user = await apiTestLogin(mockUserId);
    set({ user });
  },

  fetchMe: async () => {
    try {
      set({ loading: true });
      const user = await getMe();
      set({ user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  logout: async () => {
    await apiLogout();
    set({ user: null });
  },
}));
