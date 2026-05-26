"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import * as organizationsApi from "@/lib/api/organizations";

/**
 * AuthInitializer — auto-populates the auth store with the first available
 * organization on app load when no org is already selected.
 *
 * This is needed because the CRM app runs without a full login flow in
 * development/demo mode. Without an organization_id, all entity CRUD
 * mutations fail with a 422 validation error.
 */
export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const orgId = useAuthStore((s) => s.orgId);
  const setAuth = useAuthStore((s) => s.setAuth);
  const [initialized, setInitialized] = useState(!!orgId);

  useEffect(() => {
    if (orgId) {
      setInitialized(true);
      return;
    }

    let cancelled = false;

    async function init() {
      try {
        const result = await organizationsApi.listOrganizations();
        if (cancelled) return;
        const firstOrg = result.items[0];
        if (firstOrg) {
          // Use a demo token for development — the backend doesn't validate JWT yet
          setAuth("demo-token", firstOrg.id);
        }
      } catch {
        // If the backend is unreachable, don't block the UI
      } finally {
        if (!cancelled) setInitialized(true);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [orgId, setAuth]);

  // Don't render children until initialization is complete to prevent
  // mutations from firing with a null orgId.
  if (!initialized) return null;

  return <>{children}</>;
}
