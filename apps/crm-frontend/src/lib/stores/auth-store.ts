import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserInfo } from '@/lib/api/auth';

interface AuthState {
  token: string | null;
  orgId: string | null;
  user: UserInfo | null;
  setAuth: (token: string, orgId: string, user?: UserInfo) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      orgId: null,
      user: null,
      setAuth: (token: string, orgId: string, user?: UserInfo) =>
        set({ token, orgId, user: user ?? null }),
      logout: () => set({ token: null, orgId: null, user: null }),
    }),
    {
      name: 'crm-auth',
      partialize: (state) => ({
        token: state.token,
        orgId: state.orgId,
        user: state.user,
      }),
    },
  ),
);
