'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';

/**
 * AuthGuard — wraps dashboard routes. Redirects to /login if the user
 * is not authenticated. Waits for the persisted store to hydrate before
 * making the redirect decision to avoid flashing.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    // Zustand persist middleware hydrates asynchronously.
    // Use a small delay or check for hydration state.
    // The token starts as null and gets rehydrated; we only
    // redirect when we're sure the store has settled.
    const timeout = setTimeout(() => {
      const currentToken = useAuthStore.getState().token;
      if (!currentToken) {
        router.replace('/login');
      }
    }, 50);

    return () => clearTimeout(timeout);
  }, [token, router]);

  if (!token) {
    // Still hydrating or definitely unauthenticated.
    // Show nothing while redirect is pending to avoid a flash.
    return null;
  }

  return <>{children}</>;
}
