"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as activitiesApi from "@/lib/api/activities";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { ActivityCreate, ActivityUpdate } from "@/types";

const STALE_TIME = 30_000;

export function useActivities(params?: {
  q?: string;
  activity_type?: string;
  contact_id?: string;
  deal_id?: string;
  offset?: number;
  limit?: number;
}) {
  const orgId = useAuthStore((s) => s.orgId);
  return useQuery({
    queryKey: ["activities", orgId, params],
    queryFn: () => activitiesApi.listActivities(orgId!, params),
    enabled: !!orgId,
    staleTime: STALE_TIME,
  });
}

export function useActivity(id: string) {
  const orgId = useAuthStore((s) => s.orgId);
  return useQuery({
    queryKey: ["activities", orgId, id],
    queryFn: () => activitiesApi.getActivity(id, orgId!),
    enabled: !!orgId && !!id,
    staleTime: STALE_TIME,
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((s) => s.orgId);
  return useMutation({
    mutationFn: (body: Omit<ActivityCreate, "organization_id">) =>
      activitiesApi.createActivity({ ...body, organization_id: orgId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities", orgId] });
    },
  });
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((s) => s.orgId);
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & ActivityUpdate) =>
      activitiesApi.updateActivity(id, orgId!, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["activities", orgId] });
      queryClient.invalidateQueries({
        queryKey: ["activities", orgId, variables.id],
      });
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((s) => s.orgId);
  return useMutation({
    mutationFn: (id: string) => activitiesApi.deleteActivity(id, orgId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities", orgId] });
    },
  });
}
