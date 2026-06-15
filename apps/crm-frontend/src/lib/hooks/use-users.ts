"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as usersApi from "@/lib/api/users";
import type { UserUpdate } from "@/types";

const STALE_TIME = 30_000; // 30 seconds

/**
 * List users with optional search and pagination.
 */
export function useUsers(params?: {
  q?: string;
  offset?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => usersApi.listUsers(params),
    staleTime: STALE_TIME,
  });
}

/**
 * Get a single user by ID.
 */
export function useUser(id: string) {
  return useQuery({
    queryKey: ["users", id],
    queryFn: () => usersApi.getUser(id),
    enabled: !!id,
    staleTime: STALE_TIME,
  });
}

/**
 * Update a user and invalidate the users list + detail cache.
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & UserUpdate) =>
      usersApi.updateUser(id, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", variables.id] });
    },
  });
}

/**
 * Delete a user and invalidate the users cache.
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
