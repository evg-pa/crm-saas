import apiClient from "./client";
import type { Note, NoteCreate, NoteUpdate, PaginatedResponse } from "@/types";

export async function listNotes(params?: {
  q?: string;
  contact_id?: string;
  offset?: number;
  limit?: number;
}): Promise<PaginatedResponse<Note>> {
  const { data } = await apiClient.get<PaginatedResponse<Note>>("/notes", {
    params,
  });
  return data;
}

export async function getNote(id: string): Promise<Note> {
  const { data } = await apiClient.get<Note>(`/notes/${id}`);
  return data;
}

export async function createNote(body: NoteCreate): Promise<Note> {
  const { data } = await apiClient.post<Note>("/notes", body);
  return data;
}

export async function updateNote(
  id: string,
  body: NoteUpdate
): Promise<Note> {
  const { data } = await apiClient.patch<Note>(`/notes/${id}`, body);
  return data;
}

export async function deleteNote(id: string): Promise<void> {
  await apiClient.delete(`/notes/${id}`);
}
