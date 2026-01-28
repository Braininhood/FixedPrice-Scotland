'use client';

import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  error?: Error | string | null;
  onRetry?: () => void;
  retryLabel?: string;
  showHomeButton?: boolean;
  className?: string;
  variant?: 'default' | 'compact' | 'minimal';
}

/**
 * Error Display Component
 * 
 * Professional error display component for API errors and other failures.
 * Supports multiple variants and optional retry/home actions.
 * 
 * @example
 * ```tsx
 * <ErrorDisplay
 *   title="Failed to load listings"
 *   message="Please try again later"
 *   onRetry={() => refetch()}
 * />
 * ```
 */
export default function ErrorDisplay({
  title = 'Something went wrong',
  message,
  error,
  onRetry,
  retryLabel = 'Try Again',
  showHomeButton = false,
  className = '',
  variant = 'default',
}: ErrorDisplayProps) {
  const errorMessage = 
    typeof error === 'string' 
      ? error 
      : error?.message || message || 'An unexpected error occurred';

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-destructive', className)}>
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>{errorMessage}</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('text-center space-y-3', className)}>
        <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
        <div>
          <h3 className="font-semibold mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
        </div>
        {(onRetry || showHomeButton) && (
          <div className="flex items-center justify-center gap-2">
            {onRetry && (
              <Button onClick={onRetry} size="sm" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                {retryLabel}
              </Button>
            )}
            {showHomeButton && (
              <Button asChild size="sm" variant="outline">
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardContent className="py-12">
        <div className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <CardTitle className="mb-2">{title}</CardTitle>
            <CardDescription className="text-base">
              {errorMessage}
            </CardDescription>
          </div>
          {(onRetry || showHomeButton) && (
            <div className="flex items-center justify-center gap-3 pt-2">
              {onRetry && (
                <Button onClick={onRetry} variant="default">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {retryLabel}
                </Button>
              )}
              {showHomeButton && (
                <Button asChild variant="outline">
                  <Link href="/">
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
