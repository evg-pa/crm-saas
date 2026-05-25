import apiClient from "./client";
import type { Organization } from "@/types";

/**
 * Fetch a single organization by ID.
 * GET /api/v1/organizations/{id}
 */
export async function getOrganization(id: string): Promise<Organization> {
  const { data } = await apiClient.get<Organization>(`/organizations/${id}`);
  return data;
}
