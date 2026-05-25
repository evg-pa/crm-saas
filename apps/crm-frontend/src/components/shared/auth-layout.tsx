import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

/**
 * AuthLayout — centered card layout for authentication pages.
 *
 * Spec: APP-19 §9.2 (Layout Templates)
 * Tokens: Page: min-h-screen bg-background flex items-center justify-center p-4,
 *         Card: w-full max-w-md shadow-sm border p-6
 *
 * Lenses: Gestalt — Common Region (card isolates auth form from background),
 *         Cognition — Selective Attention (centered card focuses user on single task)
 */
export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border bg-card p-6 shadow-sm">
        {(title || description) && (
          <div className="text-center">
            {title && (
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
            )}
            {description && (
              <p className="mt-2 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
