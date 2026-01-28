'use client';

import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PoundSterling, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BudgetFilterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  min?: number;
  max?: number;
  showHelperText?: boolean;
  'aria-label'?: string;
}

/**
 * Budget Filter Component
 * 
 * Professional budget filter with:
 * - Currency formatting with £ symbol
 * - Number validation (numeric only)
 * - Range validation (optional min/max)
 * - Accessible labels and ARIA attributes
 * - Real-time formatting feedback
 * - Error state handling
 * 
 * Best Practices:
 * - Clear labeling with icon
 * - Immediate visual feedback
 * - Accessible for screen readers
 * - Mobile-friendly numeric keyboard
 * 
 * @example
 * ```tsx
 * <BudgetFilter
 *   value={budget}
 *   onChange={setBudget}
 *   min={10000}
 *   max={1000000}
 * />
 * ```
 */
export default function BudgetFilter({
  value,
  onChange,
  placeholder = 'e.g., 200000',
  id = 'max-budget',
  className = '',
  min,
  max,
  showHelperText = true,
  'aria-label': ariaLabel,
}: BudgetFilterProps) {
  const numericValue = useMemo(() => {
    if (!value) return null;
    const num = parseInt(value, 10);
    return isNaN(num) ? null : num;
  }, [value]);

  const validationError = useMemo(() => {
    if (!numericValue) return null;
    if (min !== undefined && numericValue < min) {
      return `Minimum budget is £${min.toLocaleString('en-GB')}`;
    }
    if (max !== undefined && numericValue > max) {
      return `Maximum budget is £${max.toLocaleString('en-GB')}`;
    }
    return null;
  }, [numericValue, min, max]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(/[,\s£]/g, ''); // Remove commas, spaces, and £
    // Allow only numbers and empty string
    if (inputValue === '' || /^\d+$/.test(inputValue)) {
      onChange(inputValue);
    }
  };

  const formatDisplayValue = (val: string) => {
    if (!val) return '';
    const num = parseInt(val, 10);
    if (isNaN(num)) return val;
    return num.toLocaleString('en-GB');
  };

  const displayValue = formatDisplayValue(value);

  return (
    <div className={cn('space-y-2', className)}>
      <Label 
        htmlFor={id} 
        className="flex items-center gap-2"
      >
        <PoundSterling className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <span>Max Budget</span>
        <span className="sr-only">(in British Pounds)</span>
      </Label>
      <div className="relative">
        <span 
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none"
          aria-hidden="true"
        >
          £
        </span>
        <Input
          id={id}
          type="text"
          inputMode="numeric"
          placeholder={placeholder}
          value={displayValue}
          onChange={handleChange}
          className={cn(
            'pl-7',
            validationError && 'border-destructive focus-visible:ring-destructive'
          )}
          aria-label={ariaLabel || 'Maximum budget in British Pounds'}
          aria-invalid={!!validationError}
          aria-describedby={validationError ? `${id}-error` : undefined}
          autoComplete="off"
        />
      </div>
      {validationError && (
        <div 
          id={`${id}-error`}
          className="flex items-center gap-1.5 text-xs text-destructive"
          role="alert"
        >
          <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span>{validationError}</span>
        </div>
      )}
      {showHelperText && value && !validationError && (
        <p className="text-xs text-muted-foreground" id={`${id}-helper`}>
          Showing properties up to £{numericValue?.toLocaleString('en-GB') || value}
        </p>
      )}
    </div>
  );
}
