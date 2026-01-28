'use client';

import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AreaFilterProps {
  postcode?: string;
  city?: string;
  onPostcodeChange: (value: string) => void;
  onCityChange: (value: string) => void;
  className?: string;
  showLabels?: boolean;
  validatePostcode?: boolean;
  'aria-label'?: string;
}

/**
 * UK Postcode Validation Pattern
 * Supports formats like: SW1A 1AA, EH1 1AB, G12 8QQ, M1 1AA
 */
const UK_POSTCODE_PATTERN = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
const UK_POSTCODE_PARTIAL_PATTERN = /^[A-Z]{1,2}\d{0,2}[A-Z]?\s?\d{0,1}[A-Z]{0,2}$/i;

/**
 * Area Filter Component
 * 
 * Professional area filter with:
 * - Postcode and city inputs
 * - UK postcode format validation (optional)
 * - Auto-uppercase for postcodes
 * - Accessible labels and ARIA attributes
 * - Visual feedback for validation
 * - Responsive grid layout
 * 
 * Best Practices:
 * - Combined location inputs for better UX
 * - Real-time validation feedback
 * - Mobile-friendly layout
 * - Accessible for screen readers
 * 
 * @example
 * ```tsx
 * <AreaFilter
 *   postcode={postcode}
 *   city={city}
 *   onPostcodeChange={setPostcode}
 *   onCityChange={setCity}
 *   validatePostcode={true}
 * />
 * ```
 */
export default function AreaFilter({
  postcode = '',
  city = '',
  onPostcodeChange,
  onCityChange,
  className = '',
  showLabels = true,
  validatePostcode = false,
  'aria-label': ariaLabel,
}: AreaFilterProps) {
  const postcodeError = useMemo(() => {
    if (!validatePostcode || !postcode) return null;
    // Allow partial postcodes while typing
    if (postcode.length < 5) return null;
    // Validate full postcode format
    if (!UK_POSTCODE_PATTERN.test(postcode)) {
      return 'Please enter a valid UK postcode (e.g., EH1 1AB)';
    }
    return null;
  }, [postcode, validatePostcode]);

  const handlePostcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().trim();
    // Remove spaces and allow only alphanumeric
    const cleaned = value.replace(/[^A-Z0-9\s]/g, '');
    onPostcodeChange(cleaned);
  };

  const activeLocation = useMemo(() => {
    return [postcode, city].filter(Boolean).join(', ') || null;
  }, [postcode, city]);

  return (
    <div className={cn('space-y-4', className)}>
      {showLabels && (
        <Label className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span>Location</span>
        </Label>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Postcode Input */}
        <div className="space-y-2">
          {showLabels && (
            <Label htmlFor="filter-postcode" className="text-sm">
              Postcode
              {validatePostcode && <span className="text-muted-foreground ml-1">(optional)</span>}
            </Label>
          )}
          <div className="relative">
            <MapPin 
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none",
                postcodeError ? "text-destructive" : "text-muted-foreground"
              )}
              aria-hidden="true"
            />
            <Input
              id="filter-postcode"
              placeholder="e.g., EH1, G12"
              value={postcode}
              onChange={handlePostcodeChange}
              className={cn(
                'pl-10',
                postcodeError && 'border-destructive focus-visible:ring-destructive'
              )}
              maxLength={10}
              aria-label={ariaLabel ? `${ariaLabel} - Postcode` : 'Postcode'}
              aria-invalid={!!postcodeError}
              aria-describedby={postcodeError ? 'filter-postcode-error' : undefined}
              autoComplete="postal-code"
            />
          </div>
          {postcodeError && (
            <div 
              id="filter-postcode-error"
              className="flex items-center gap-1.5 text-xs text-destructive"
              role="alert"
            >
              <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span>{postcodeError}</span>
            </div>
          )}
        </div>

        {/* City Input */}
        <div className="space-y-2">
          {showLabels && (
            <Label htmlFor="filter-city" className="text-sm">
              City
              <span className="text-muted-foreground ml-1">(optional)</span>
            </Label>
          )}
          <Input
            id="filter-city"
            placeholder="e.g., Edinburgh, Glasgow"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            aria-label={ariaLabel ? `${ariaLabel} - City` : 'City'}
            autoComplete="address-level2"
          />
        </div>
      </div>

      {activeLocation && (
        <p className="text-xs text-muted-foreground" id="filter-location-helper">
          Searching in: <span className="font-medium">{activeLocation}</span>
        </p>
      )}
    </div>
  );
}
