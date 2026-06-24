'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterDef {
  label: string;
  key: string;
  options: FilterOption[];
  value: string | null;
}

interface FilterBarProps {
  filters: FilterDef[];
  onChange: (key: string, value: string | null) => void;
  onClearAll: () => void;
  className?: string;
}

/**
 * FilterBar — horizontal filter controls above a data table.
 *
 * Spec: APP-19 §8.2.10
 * Tokens: flex gap-2 mb-4, individual filter uses Badge-style pills
 *
 * Lenses: Progressive Disclosure (common filters shown, advanced in dropdown),
 *         Hick's Law (limited visible options, rest behind dropdown)
 */
export function FilterBar({ filters, onChange, onClearAll, className }: FilterBarProps) {
  const hasActiveFilters = filters.some((f) => f.value !== null);

  return (
    <div className={cn('flex flex-wrap items-center gap-2 mb-4', className)}>
      {filters.map((filter) => (
        <div key={filter.key} className="flex flex-wrap items-center gap-1">
          <span className="text-xs font-medium text-muted-foreground mr-1">{filter.label}:</span>
          {filter.options.map((option) => {
            const isActive = filter.value === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(filter.key, isActive ? null : option.value)}
                className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors border',
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground',
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ))}

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="mr-1 h-3 w-3" />
          Clear all
        </Button>
      )}
    </div>
  );
}
