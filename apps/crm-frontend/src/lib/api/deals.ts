import apiClient from './client';
import type { Deal, DealCreate, DealUpdate, PaginatedResponse } from '@/types';

export async function listDeals(
  organizationId: string,
  params?: {
    q?: string;
    stage?: string;
    contact_id?: string;
    company_id?: string;
    offset?: number;
    limit?: number;
  },
): Promise<PaginatedResponse<Deal>> {
  const { data } = await apiClient.get<PaginatedResponse<Deal>>('/deals', {
    params: { organization_id: organizationId, ...params },
  });
  return data;
}

export async function getDeal(id: string, organizationId: string): Promise<Deal> {
  const { data } = await apiClient.get<Deal>(`/deals/${id}`, {
    params: { organization_id: organizationId },
  });
  return data;
}

export async function createDeal(body: DealCreate): Promise<Deal> {
  const { data } = await apiClient.post<Deal>('/deals', body);
  return data;
}

export async function updateDeal(
  id: string,
  organizationId: string,
  body: DealUpdate,
): Promise<Deal> {
  const { data } = await apiClient.patch<Deal>(`/deals/${id}`, body, {
    params: { organization_id: organizationId },
  });
  return data;
}

export async function deleteDeal(id: string, organizationId: string): Promise<void> {
  await apiClient.delete(`/deals/${id}`, {
    params: { organization_id: organizationId },
  });
}
