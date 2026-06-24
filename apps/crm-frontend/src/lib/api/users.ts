import apiClient from './client';
import type { User, UserUpdate, PaginatedResponse } from '@/types';

/**
 * List users in the authenticated user's organization.
 * Supports optional search across full_name and email.
 */
export async function listUsers(params?: {
  q?: string;
  offset?: number;
  limit?: number;
}): Promise<PaginatedResponse<User>> {
  const { data } = await apiClient.get<PaginatedResponse<User>>('/users', {
    params,
  });
  return data;
}

/**
 * Get a single user by ID.
 */
export async function getUser(id: string): Promise<User> {
  const { data } = await apiClient.get<User>(`/users/${id}`);
  return data;
}

/**
 * Update a user's full_name, role, or is_active flag.
 */
export async function updateUser(id: string, body: UserUpdate): Promise<User> {
  const { data } = await apiClient.patch<User>(`/users/${id}`, body);
  return data;
}

/**
 * Soft-delete a user (admin only).
 */
export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}
