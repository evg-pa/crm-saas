import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    label: string;
  };
  icon?: LucideIcon;
  className?: string;
}

/**
 * StatCard — KPI metric card for dashboards.
 *
 * Spec: APP-19 §8.2.5
 * Tokens: Card base p-4, label text-sm text-muted-foreground,
 *         value text-3xl font-bold tracking-tight mt-1,
 *         trend text-xs with success/destructive color
 *
 * Lenses: Cognition — Von Restorff (value stands out against label),
 *         Gestalt — Proximity (label+value+trend grouped as one perceptual unit)
 */
export function StatCard({ label, value, trend, icon: Icon, className }: StatCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
        </div>
        <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">{value}</p>
        {trend && (
          <p
            className={cn(
              'mt-1 text-xs font-medium',
              trend.direction === 'up' ? 'text-success' : 'text-destructive',
            )}
          >
            {trend.direction === 'up' ? '↑' : '↓'} {trend.value}% {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
