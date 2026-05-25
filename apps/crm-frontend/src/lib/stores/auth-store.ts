import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  orgId: string | null;
  setAuth: (token: string, orgId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      orgId: null,
      setAuth: (token: string, orgId: string) => set({ token, orgId }),
      logout: () => set({ token: null, orgId: null }),
    }),
    {
      name: "crm-auth",
    }
  )
);
