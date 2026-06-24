// ============================================================
// @app/shared-types — Canonical TypeScript types for the App platform
// ============================================================

/** Unique identifier string (UUID v4). */
export type ID = string;

/** ISO 8601 datetime string. */
export type ISODateString = string;

/** Semantic version string (e.g. "1.2.3"). */
export type SemVer = string;

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

/** System role for authorization. */
export type UserRole = 'admin' | 'editor' | 'viewer';

/** Core user profile. */
export interface User {
  id: ID;
  email: string;
  displayName: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ---------------------------------------------------------------------------
// Project
// ---------------------------------------------------------------------------

/** Project status lifecycle. */
export type ProjectStatus = 'draft' | 'active' | 'archived';

/** A top-level project. */
export interface Project {
  id: ID;
  name: string;
  slug: string;
  description: string;
  status: ProjectStatus;
  ownerId: ID;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ---------------------------------------------------------------------------
// AppSpec
// ---------------------------------------------------------------------------

/** An application specification — the blueprint for generated apps. */
export interface AppSpec {
  id: ID;
  name: string;
  slug: string;
  description: string;
  /** The project this app belongs to. */
  projectId: ID;
  /** Template used to generate the app. */
  template: string;
  /** Arbitrary key-value overrides for template generation. */
  config: Record<string, unknown>;
  status: ProjectStatus;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

/** Standard paginated response wrapper. */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Standard API error shape. */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/** Generic API result — success or error discriminated union. */
export type ApiResult<T> = { success: true; data: T } | { success: false; error: ApiError };
