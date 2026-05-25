import apiClient from "./client";
import type {
  Company,
  CompanyCreate,
  CompanyUpdate,
  PaginatedResponse,
} from "@/types";

export async function listCompanies(
  organizationId: string,
  params?: { q?: string; industry?: string; offset?: number; limit?: number }
): Promise<PaginatedResponse<Company>> {
  const { data } = await apiClient.get<PaginatedResponse<Company>>("/companies", {
    params: { organization_id: organizationId, ...params },
  });
  return data;
}

export async function getCompany(
  id: string,
  organizationId: string
): Promise<Company> {
  const { data } = await apiClient.get<Company>(`/companies/${id}`, {
    params: { organization_id: organizationId },
  });
  return data;
}

export async function createCompany(
  body: CompanyCreate
): Promise<Company> {
  const { data } = await apiClient.post<Company>("/companies", body);
  return data;
}

export async function updateCompany(
  id: string,
  organizationId: string,
  body: CompanyUpdate
): Promise<Company> {
  const { data } = await apiClient.patch<Company>(`/companies/${id}`, body, {
    params: { organization_id: organizationId },
  });
  return data;
}

export async function deleteCompany(
  id: string,
  organizationId: string
): Promise<void> {
  await apiClient.delete(`/companies/${id}`, {
    params: { organization_id: organizationId },
  });
}
