"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as dealsApi from "@/lib/api/deals";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { DealCreate, DealUpdate } from "@/types";

const STALE_TIME = 30_000;

export function useDeals(params?: {
  q?: string;
  stage?: string;
  contact_id?: string;
  company_id?: string;
  offset?: number;
  limit?: number;
}) {
  const orgId = useAuthStore((s) => s.orgId);
  return useQuery({
    queryKey: ["deals", orgId, params],
    queryFn: () => dealsApi.listDeals(orgId!, params),
    enabled: !!orgId,
    staleTime: STALE_TIME,
  });
}

export function useDeal(id: string) {
  const orgId = useAuthStore((s) => s.orgId);
  return useQuery({
    queryKey: ["deals", orgId, id],
    queryFn: () => dealsApi.getDeal(id, orgId!),
    enabled: !!orgId && !!id,
    staleTime: STALE_TIME,
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((s) => s.orgId);
  return useMutation({
    mutationFn: (body: Omit<DealCreate, "organization_id">) =>
      dealsApi.createDeal({ ...body, organization_id: orgId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals", orgId] });
    },
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((s) => s.orgId);
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & DealUpdate) =>
      dealsApi.updateDeal(id, orgId!, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["deals", orgId] });
      queryClient.invalidateQueries({ queryKey: ["deals", orgId, variables.id] });
    },
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((s) => s.orgId);
  return useMutation({
    mutationFn: (id: string) => dealsApi.deleteDeal(id, orgId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals", orgId] });
    },
  });
}
