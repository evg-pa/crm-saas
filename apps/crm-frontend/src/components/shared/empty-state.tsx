import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  children?: ReactNode;
}

/**
 * EmptyState — shown when a list/table has zero items.
 *
 * Spec: APP-19 §8.2.4
 * Tokens: py-16 text-center, icon text-muted-foreground/40 w-12 h-12 mx-auto,
 *         title text-lg font-semibold mt-4, desc text-sm text-muted-foreground mt-1 max-w-sm mx-auto
 *
 * Lenses: Cognition — Mental Models (matches user expectation of "nothing here yet" patterns),
 *         Emotional — Norman's reflective level (turns a void into an invitation)
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className
      )}
    >
      {Icon && (
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Icon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
      )}
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick} className="mt-6" size="sm">
          {action.label}
        </Button>
      )}
      {children}
    </div>
  );
}
