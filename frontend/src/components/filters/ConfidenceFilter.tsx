'use client';

import React, { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Info, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface ConfidenceFilterProps {
  value: string;
  onChange: (value: string) => void;
  hasSubscription: boolean;
  disabled?: boolean;
  className?: string;
  showUpgradePrompt?: boolean;
  'aria-label'?: string;
}

/**
 * Confidence Filter Component
 * 
 * Professional confidence level filter with:
 * - Subscription gating for premium features
 * - Clear labeling with visual indicators
 * - Accessible select component
 * - Helpful descriptions for each option
 * 
 * Options:
 * - "all": All confidence levels (default)
 * - "explicit": Explicit Fixed Price only (highest confidence)
 * - "explicit_and_likely": Explicit + Likely Fixed Price (recommended)
 * 
 * Best Practices:
 * - Clear labeling with subscription-gated premium features
 * - Visual feedback for active selections
 * - Helpful upgrade prompts for non-subscribers
 * - Accessible for screen readers
 * 
 * @example
 * ```tsx
 * <ConfidenceFilter
 *   value={confidence}
 *   onChange={setConfidence}
 *   hasSubscription={hasActiveSubscription}
 * />
 * ```
 */
export default function ConfidenceFilter({
  value,
  onChange,
  hasSubscription,
  disabled = false,
  className = '',
  showUpgradePrompt = true,
  'aria-label': ariaLabel,
}: ConfidenceFilterProps) {
  const selectedLabel = useMemo(() => {
    switch (value) {
      case 'explicit':
        return 'Explicit Fixed Price Only';
      case 'explicit_and_likely':
        return 'Explicit + Likely Fixed Price';
      default:
        return 'All confidence levels';
    }
  }, [value]);

  const description = useMemo(() => {
    switch (value) {
      case 'explicit':
        return 'Showing only listings with explicit fixed price indicators (highest confidence)';
      case 'explicit_and_likely':
        return 'Showing listings with explicit or likely fixed price indicators (recommended)';
      default:
        return 'Showing all listings regardless of classification';
    }
  }, [value]);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Label 
          htmlFor="confidence-level" 
          className="flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span>Classification Type</span>
        </Label>
        {!hasSubscription && (
          <Badge variant="outline" className="text-xs">
            Premium
          </Badge>
        )}
      </div>
      
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled || !hasSubscription}
      >
        <SelectTrigger 
          id="confidence-level"
          aria-label={ariaLabel || 'Classification confidence level filter'}
          aria-describedby={hasSubscription ? 'confidence-description' : 'confidence-upgrade'}
        >
          <SelectValue placeholder="All confidence levels">
            {value !== 'all' && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <span>{selectedLabel}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex flex-col">
              <span>All confidence levels</span>
              <span className="text-xs text-muted-foreground">Show all listings</span>
            </div>
          </SelectItem>
          <SelectItem value="explicit">
            <div className="flex flex-col">
              <span>Explicit Fixed Price Only</span>
              <span className="text-xs text-muted-foreground">Highest confidence</span>
            </div>
          </SelectItem>
          <SelectItem value="explicit_and_likely">
            <div className="flex flex-col">
              <span>Explicit + Likely Fixed Price</span>
              <span className="text-xs text-muted-foreground">Recommended</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {!hasSubscription && showUpgradePrompt && (
        <div 
          id="confidence-upgrade"
          className="p-3 bg-muted rounded-lg border border-primary/10"
          role="alert"
        >
          <div className="flex items-start gap-2 mb-2">
            <Info className="h-3 w-3 shrink-0 mt-0.5 text-muted-foreground" aria-hidden="true" />
            <p className="text-xs text-muted-foreground leading-tight">
              Advanced filters require a subscription to help you find the best fixed-price properties.
            </p>
          </div>
          <Button asChild size="sm" variant="outline" className="w-full mt-2">
            <Link href="/pricing">View Plans</Link>
          </Button>
        </div>
      )}

      {hasSubscription && value && value !== 'all' && (
        <p 
          id="confidence-description"
          className="text-xs text-muted-foreground flex items-start gap-1.5"
        >
          <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5 text-primary" aria-hidden="true" />
          <span>{description}</span>
        </p>
      )}
    </div>
  );
}
