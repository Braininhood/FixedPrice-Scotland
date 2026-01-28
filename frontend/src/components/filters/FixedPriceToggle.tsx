'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FixedPriceToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  className?: string;
  id?: string;
  defaultChecked?: boolean;
  'aria-label'?: string;
}

/**
 * Fixed Price Only Toggle Component
 * 
 * Professional toggle for filtering out competitive listings.
 * 
 * Behavior:
 * - When ON (default): Shows only Explicit and Likely fixed price listings
 * - When OFF: Shows all listings including Competitive offers
 * 
 * Best Practices:
 * - Clear labeling with helpful description
 * - Visual feedback (checkmark when active)
 * - Accessible switch control
 * - Default to ON for better user experience
 * 
 * @example
 * ```tsx
 * <FixedPriceToggle
 *   value={fixedPriceOnly}
 *   onChange={setFixedPriceOnly}
 *   defaultChecked={true}
 * />
 * ```
 */
export default function FixedPriceToggle({
  value,
  onChange,
  className = '',
  id = 'fixed-price-only',
  defaultChecked = true,
  'aria-label': ariaLabel,
}: FixedPriceToggleProps) {
  // Ensure default is ON if not explicitly set
  const isChecked = value ?? defaultChecked;

  return (
    <div 
      className={cn(
        'flex items-center justify-between rounded-lg border p-4 transition-colors',
        isChecked ? 'border-primary/20 bg-primary/5' : 'border-border',
        className
      )}
    >
      <div className="space-y-0.5 flex-1">
        <div className="flex items-center gap-2">
          <Label 
            htmlFor={id} 
            className="font-medium cursor-pointer"
          >
            Fixed Price Only
          </Label>
          {isChecked ? (
            <CheckCircle2 
              className="h-4 w-4 text-primary" 
              aria-hidden="true"
              aria-label="Active"
            />
          ) : (
            <XCircle 
              className="h-4 w-4 text-muted-foreground" 
              aria-hidden="true"
              aria-label="Inactive"
            />
          )}
        </div>
        <p 
          className="text-xs text-muted-foreground leading-relaxed"
          id={`${id}-description`}
        >
          {isChecked 
            ? 'Showing only Explicit and Likely fixed price listings (recommended)'
            : 'Showing all listings including competitive offers'}
        </p>
      </div>
      <Switch
        id={id}
        checked={isChecked}
        onCheckedChange={onChange}
        aria-label={ariaLabel || 'Toggle fixed price only filter'}
        aria-describedby={`${id}-description`}
        defaultChecked={defaultChecked}
      />
    </div>
  );
}
