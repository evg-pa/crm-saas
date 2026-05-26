import apiClient from "./client";
import type { Organization, PaginatedResponse } from "@/types";

/**
 * Fetch a single organization by ID.
 * GET /api/v1/organizations/{id}
 */
export async function getOrganization(id: string): Promise<Organization> {
  const { data } = await apiClient.get<Organization>(`/organizations/${id}`);
  return data;
}

/**
 * List all organizations.
 * GET /api/v1/organizations
 */
export async function listOrganizations(): Promise<PaginatedResponse<Organization>> {
  const { data } = await apiClient.get<PaginatedResponse<Organization>>("/organizations");
  return data;
}
