"use client";

import { useQuery } from "@tanstack/react-query";
import * as organizationsApi from "@/lib/api/organizations";
import { useAuthStore } from "@/lib/stores/auth-store";

const STALE_TIME = 60_000; // org data changes rarely

/**
 * Fetch the current user's organization by orgId from the auth store.
 */
export function useCurrentOrganization() {
  const orgId = useAuthStore((s) => s.orgId);
  return useQuery({
    queryKey: ["organizations", orgId],
    queryFn: () => organizationsApi.getOrganization(orgId!),
    enabled: !!orgId,
    staleTime: STALE_TIME,
  });
}
