"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as notesApi from "@/lib/api/notes";
import type { NoteCreate, NoteUpdate } from "@/types";

const STALE_TIME = 30_000; // 30 seconds

export function useNotes(params?: {
  q?: string;
  contact_id?: string;
  offset?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["notes", params],
    queryFn: () => notesApi.listNotes(params),
    staleTime: STALE_TIME,
  });
}

export function useNote(id: string) {
  return useQuery({
    queryKey: ["notes", id],
    queryFn: () => notesApi.getNote(id),
    enabled: !!id,
    staleTime: STALE_TIME,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: NoteCreate) => notesApi.createNote(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & NoteUpdate) =>
      notesApi.updateNote(id, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["notes", variables.id] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notesApi.deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}
