'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';

export interface ActiveFilter {
  key: string;
  label: string;
  value: string;
  onRemove: () => void;
}

export interface FilterBarProps {
  activeFilters: ActiveFilter[];
  onClearAll: () => void;
  resultCount?: number;
  className?: string;
}

/**
 * Filter Bar Component
 * 
 * Displays active filters as removable badges.
 * Shows result count and clear all option.
 * 
 * Best Practice: Easy filter removal with visual feedback
 */
export default function FilterBar({
  activeFilters,
  onClearAll,
  resultCount,
  className = '',
}: FilterBarProps) {
  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span>Active filters:</span>
        {resultCount !== undefined && (
          <span className="font-medium text-foreground">
            {resultCount} {resultCount === 1 ? 'result' : 'results'}
          </span>
        )}
      </div>

      {activeFilters.map((filter) => (
        <Badge
          key={filter.key}
          variant="secondary"
          className="gap-1 pr-1"
        >
          <span>{filter.label}: {filter.value}</span>
          <button
            onClick={filter.onRemove}
            className="ml-1 hover:text-destructive transition-colors rounded-full hover:bg-destructive/10 p-0.5"
            aria-label={`Remove ${filter.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="h-7 text-xs"
      >
        Clear All
      </Button>
    </div>
  );
}
