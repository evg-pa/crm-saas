import apiClient from "./client";

export interface RegisterPayload {
  email: string;
  password: string;
  full_name?: string;
  organization_name: string;
  organization_slug: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UserInfo {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  organization_id: string;
  user: UserInfo;
}

/**
 * Register a new user + organization. Returns JWT + org_id.
 * POST /api/v1/auth/register
 */
export async function register(payload: RegisterPayload): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>("/auth/register", payload);
  return data;
}

/**
 * Login with existing credentials. Returns JWT + org_id.
 * POST /api/v1/auth/login
 */
export async function login(payload: LoginPayload): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>("/auth/login", payload);
  return data;
}
