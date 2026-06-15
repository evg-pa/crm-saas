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

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

/**
 * Request a password reset link. Does not reveal whether the email exists.
 * POST /api/v1/auth/forgot-password
 */
export async function forgotPassword(
  payload: ForgotPasswordPayload
): Promise<ForgotPasswordResponse> {
  const { data } = await apiClient.post<ForgotPasswordResponse>(
    "/auth/forgot-password",
    payload
  );
  return data;
}

export interface ResetPasswordPayload {
  token: string;
  new_password: string;
}

export interface ResetPasswordResponse {
  message: string;
}

/**
 * Reset password using a token from the reset-password email.
 * POST /api/v1/auth/reset-password
 */
export async function resetPassword(
  payload: ResetPasswordPayload
): Promise<ResetPasswordResponse> {
  const { data } = await apiClient.post<ResetPasswordResponse>(
    "/auth/reset-password",
    payload
  );
  return data;
}
