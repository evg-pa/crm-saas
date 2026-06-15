"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as notesApi from "@/lib/api/notes";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { NoteCreate, NoteUpdate } from "@/types";

const STALE_TIME = 30_000; // 30 seconds

export function useNotes(params?: {
  q?: string;
  contact_id?: string;
  offset?: number;
  limit?: number;
}) {
  const orgId = useAuthStore((s) => s.orgId);
  return useQuery({
    queryKey: ["notes", orgId, params],
    queryFn: () => notesApi.listNotes(params),
    enabled: !!orgId,
    staleTime: STALE_TIME,
  });
}

export function useNote(id: string) {
  const orgId = useAuthStore((s) => s.orgId);
  return useQuery({
    queryKey: ["notes", orgId, id],
    queryFn: () => notesApi.getNote(id),
    enabled: !!orgId && !!id,
    staleTime: STALE_TIME,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((s) => s.orgId);
  return useMutation({
    mutationFn: (body: NoteCreate) => notesApi.createNote(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", orgId] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((s) => s.orgId);
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & NoteUpdate) =>
      notesApi.updateNote(id, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["notes", orgId] });
      queryClient.invalidateQueries({ queryKey: ["notes", orgId, variables.id] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((s) => s.orgId);
  return useMutation({
    mutationFn: (id: string) => notesApi.deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", orgId] });
    },
  });
}
