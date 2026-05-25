import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import { useAuthStore } from "@/lib/stores/auth-store";

/** Set a fake auth token + org so hooks are enabled. */
export function setFakeAuth() {
  useAuthStore.setState({ token: "test-token", orgId: "test-org-id" });
}

/** Reset the auth store and query client between tests. */
export function resetFakeAuth() {
  useAuthStore.setState({ token: null, orgId: null });
}

/**
 * Create a fresh QueryClient for each test render so cached data
 * does not leak between test cases.
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface WrapperOptions {
  queryClient?: QueryClient;
}

/**
 * Render a component wrapped with QueryClientProvider and any other
 * global providers needed for tests.
 */
export function renderWithProviders(
  ui: ReactNode,
  options?: WrapperOptions & Omit<RenderOptions, "wrapper">
): ReturnType<typeof render> & { queryClient: QueryClient } {
  const queryClient = options?.queryClient ?? makeQueryClient();

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return {
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
}
