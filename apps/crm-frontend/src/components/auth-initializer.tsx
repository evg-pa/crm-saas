"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import * as authApi from "@/lib/api/auth";

/**
 * AuthInitializer — auto-registers a dev user and gets a real JWT token
 * on first app load. Falls back to login if the user already exists.
 *
 * Without this, the CRM runs with null token → all CRUD calls 401 → nothing works.
 */
export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);
  const [initialized, setInitialized] = useState(!!token);

  useEffect(() => {
    if (token) {
      setInitialized(true);
      return;
    }

    let cancelled = false;

    async function init() {
      const payload = {
        email: "dev@crm.local",
        password: "devpass123",
        full_name: "Dev User",
        organization_name: "Dev Org",
        organization_slug: "dev-org",
      };

      try {
        // Try registering fresh
        const result = await authApi.register(payload);
        if (!cancelled) {
          setAuth(result.access_token, result.organization_id);
        }
      } catch (regErr: any) {
        if (cancelled) return;
        // 409 = user already exists, try logging in
        if (regErr?.response?.status === 409) {
          try {
            const result = await authApi.login({
              email: payload.email,
              password: payload.password,
            });
            if (!cancelled) {
              setAuth(result.access_token, result.organization_id);
            }
          } catch {
            // Backend unreachable — don't block the UI
          }
        }
        // Other errors (network, etc.) — don't block UI
      } finally {
        if (!cancelled) setInitialized(true);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [token, setAuth]);

  if (!initialized) return null;

  return <>{children}</>;
}
