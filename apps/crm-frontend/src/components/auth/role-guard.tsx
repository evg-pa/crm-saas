"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { UserRole } from "@/types";

interface RoleGuardProps {
  /** Minimum role required to access the children. */
  role: UserRole;
  /** Custom redirect path (defaults to "/"). */
  fallbackPath?: string;
  /** Custom fallback render. Overrides redirect behavior. */
  fallback?: React.ReactNode;
  /** Children to render when the role check passes. */
  children: React.ReactNode;
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 3,
  manager: 2,
  member: 1,
};

/**
 * RoleGuard — wraps content and hides or redirects if the current user
 * lacks the required role.
 *
 * Admin > manager > member. A user passes if their role level >= required.
 *
 * Usage:
 *   <RoleGuard role="admin"><AdminPanel /></RoleGuard>
 *   <RoleGuard role="admin" fallback={<AccessDenied />}><AdminPanel /></RoleGuard>
 */
export function RoleGuard({
  role: requiredRole,
  fallbackPath = "/",
  fallback,
  children,
}: RoleGuardProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const currentLevel = user?.role ? (ROLE_HIERARCHY[user.role] ?? 0) : 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0;

  if (currentLevel >= requiredLevel) {
    return <>{children}</>;
  }

  // If a custom fallback is provided, render it instead of redirecting.
  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  // Redirect if on client side and no fallback.
  if (typeof window !== "undefined") {
    router.replace(fallbackPath);
    return null;
  }

  return null;
}

/**
 * useHasRole — hook to check if the current user meets a minimum role.
 * Returns true if the user has the required role or higher.
 */
export function useHasRole(requiredRole: UserRole): boolean {
  const user = useAuthStore((s) => s.user);
  const currentLevel = user?.role ? (ROLE_HIERARCHY[user.role] ?? 0) : 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0;
  return currentLevel >= requiredLevel;
}

/**
 * useCurrentRole — hook that returns the current user's role or null.
 */
export function useCurrentRole(): UserRole | null {
  return useAuthStore((s) => s.user?.role ?? null);
}
