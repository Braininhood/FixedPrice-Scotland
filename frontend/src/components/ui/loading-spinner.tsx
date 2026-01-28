'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

/**
 * Loading Spinner Component
 * 
 * Reusable loading spinner with multiple size options and optional text.
 * Can be used inline or as a full-screen overlay.
 * 
 * @example
 * ```tsx
 * <LoadingSpinner size="lg" text="Loading listings..." />
 * <LoadingSpinner fullScreen />
 * ```
 */
export default function LoadingSpinner({
  size = 'md',
  className = '',
  text,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {text && (
        <p className="text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}
