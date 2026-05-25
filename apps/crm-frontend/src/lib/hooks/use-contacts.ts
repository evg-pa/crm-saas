"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as contactsApi from "@/lib/api/contacts";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { ContactCreate, ContactUpdate } from "@/types";

const STALE_TIME = 30_000; // 30 seconds

export function useContacts(params?: { q?: string; offset?: number; limit?: number }) {
  const orgId = useAuthStore((s) => s.orgId);
  return useQuery({
    queryKey: ["contacts", orgId, params],
    queryFn: () => contactsApi.listContacts(orgId!, params),
    enabled: !!orgId,
    staleTime: STALE_TIME,
  });
}

export function useContact(id: string) {
  const orgId = useAuthStore((s) => s.orgId);
  return useQuery({
    queryKey: ["contacts", orgId, id],
    queryFn: () => contactsApi.getContact(id, orgId!),
    enabled: !!orgId && !!id,
    staleTime: STALE_TIME,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((s) => s.orgId);
  return useMutation({
    mutationFn: (body: Omit<ContactCreate, "organization_id">) =>
      contactsApi.createContact({ ...body, organization_id: orgId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts", orgId] });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((s) => s.orgId);
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & ContactUpdate) =>
      contactsApi.updateContact(id, orgId!, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contacts", orgId] });
      queryClient.invalidateQueries({
        queryKey: ["contacts", orgId, variables.id],
      });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((s) => s.orgId);
  return useMutation({
    mutationFn: (id: string) => contactsApi.deleteContact(id, orgId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts", orgId] });
    },
  });
}
