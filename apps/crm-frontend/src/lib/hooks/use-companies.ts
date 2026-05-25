"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as companiesApi from "@/lib/api/companies";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { CompanyCreate, CompanyUpdate } from "@/types";

const STALE_TIME = 30_000;

export function useCompanies(params?: { q?: string; industry?: string; offset?: number; limit?: number }) {
  const orgId = useAuthStore((s) => s.orgId);
  return useQuery({
    queryKey: ["companies", orgId, params],
    queryFn: () => companiesApi.listCompanies(orgId!, params),
    enabled: !!orgId,
    staleTime: STALE_TIME,
  });
}

export function useCompany(id: string) {
  const orgId = useAuthStore((s) => s.orgId);
  return useQuery({
    queryKey: ["companies", orgId, id],
    queryFn: () => companiesApi.getCompany(id, orgId!),
    enabled: !!orgId && !!id,
    staleTime: STALE_TIME,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((s) => s.orgId);
  return useMutation({
    mutationFn: (body: Omit<CompanyCreate, "organization_id">) =>
      companiesApi.createCompany({ ...body, organization_id: orgId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies", orgId] });
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((s) => s.orgId);
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & CompanyUpdate) =>
      companiesApi.updateCompany(id, orgId!, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["companies", orgId] });
      queryClient.invalidateQueries({
        queryKey: ["companies", orgId, variables.id],
      });
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((s) => s.orgId);
  return useMutation({
    mutationFn: (id: string) => companiesApi.deleteCompany(id, orgId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies", orgId] });
    },
  });
}
