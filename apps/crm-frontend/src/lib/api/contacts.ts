import apiClient from "./client";
import type {
  Contact,
  ContactCreate,
  ContactUpdate,
  PaginatedResponse,
} from "@/types";

export async function listContacts(
  organizationId: string,
  params?: { q?: string; offset?: number; limit?: number }
): Promise<PaginatedResponse<Contact>> {
  const { data } = await apiClient.get<PaginatedResponse<Contact>>("/contacts", {
    params: { organization_id: organizationId, ...params },
  });
  return data;
}

export async function getContact(
  id: string,
  organizationId: string
): Promise<Contact> {
  const { data } = await apiClient.get<Contact>(`/contacts/${id}`, {
    params: { organization_id: organizationId },
  });
  return data;
}

export async function createContact(
  body: ContactCreate
): Promise<Contact> {
  const { data } = await apiClient.post<Contact>("/contacts", body);
  return data;
}

export async function updateContact(
  id: string,
  organizationId: string,
  body: ContactUpdate
): Promise<Contact> {
  const { data } = await apiClient.patch<Contact>(`/contacts/${id}`, body, {
    params: { organization_id: organizationId },
  });
  return data;
}

export async function deleteContact(
  id: string,
  organizationId: string
): Promise<void> {
  await apiClient.delete(`/contacts/${id}`, {
    params: { organization_id: organizationId },
  });
}
