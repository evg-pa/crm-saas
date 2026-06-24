import apiClient from './client';
import type { Activity, ActivityCreate, ActivityUpdate, PaginatedResponse } from '@/types';

export async function listActivities(
  organizationId: string,
  params?: {
    q?: string;
    activity_type?: string;
    contact_id?: string;
    deal_id?: string;
    offset?: number;
    limit?: number;
  },
): Promise<PaginatedResponse<Activity>> {
  const { data } = await apiClient.get<PaginatedResponse<Activity>>('/activities', {
    params: { organization_id: organizationId, ...params },
  });
  return data;
}

export async function getActivity(id: string, organizationId: string): Promise<Activity> {
  const { data } = await apiClient.get<Activity>(`/activities/${id}`, {
    params: { organization_id: organizationId },
  });
  return data;
}

export async function createActivity(body: ActivityCreate): Promise<Activity> {
  const { data } = await apiClient.post<Activity>('/activities', body);
  return data;
}

export async function updateActivity(
  id: string,
  organizationId: string,
  body: ActivityUpdate,
): Promise<Activity> {
  const { data } = await apiClient.patch<Activity>(`/activities/${id}`, body, {
    params: { organization_id: organizationId },
  });
  return data;
}

export async function deleteActivity(id: string, organizationId: string): Promise<void> {
  await apiClient.delete(`/activities/${id}`, {
    params: { organization_id: organizationId },
  });
}
