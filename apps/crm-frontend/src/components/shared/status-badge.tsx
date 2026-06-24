import { cn } from '@/lib/utils';
import { Badge, type BadgeProps } from '@/components/ui/badge';

type StatusVariant = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost' | 'archived';

const statusConfig: Record<
  StatusVariant,
  { label: string; variant: BadgeProps['variant']; className?: string }
> = {
  new: { label: 'New', variant: 'secondary' },
  contacted: { label: 'Contacted', variant: 'secondary' },
  qualified: { label: 'Qualified', variant: 'default' },
  proposal: { label: 'Proposal', variant: 'default' },
  won: {
    label: 'Won',
    variant: 'default',
    className: 'bg-success/10 text-success border-success/20',
  },
  lost: { label: 'Lost', variant: 'destructive' },
  archived: { label: 'Archived', variant: 'outline' },
};

interface StatusBadgeProps {
  status: StatusVariant;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * StatusBadge — semantic status indicator for lead/deal stages.
 *
 * Spec: APP-19 §8.2.9
 * Tokens: Badge variant mapped to status, text-xs font-medium, dot + label
 *
 * Lenses: Cognition — Selective Attention (color-coded for rapid scanning),
 *         Accessibility — color-independence (includes text label, not color alone)
 */
export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'font-medium',
        size === 'sm' && 'text-[10px] px-1.5 py-0',
        config.className,
        className,
      )}
    >
      <span
        className={cn(
          'mr-1 inline-block h-1.5 w-1.5 rounded-full',
          status === 'won' && 'bg-success',
          status === 'lost' && 'bg-destructive',
          status === 'archived' && 'bg-muted-foreground',
          status === 'new' && 'bg-info',
          status === 'contacted' && 'bg-info',
          status === 'qualified' && 'bg-warning',
          status === 'proposal' && 'bg-warning',
        )}
        aria-hidden="true"
      />
      {config.label}
    </Badge>
  );
}

export { type StatusVariant };
