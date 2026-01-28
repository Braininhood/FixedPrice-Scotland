'use client';

import React from 'react';
import { Search, Inbox, FileX, Home, FilterX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type EmptyStateType = 
  | 'no-results' 
  | 'no-listings' 
  | 'no-saved-searches' 
  | 'no-data' 
  | 'not-found'
  | 'custom';

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
  variant?: 'default' | 'compact';
}

const defaultConfigs: Record<EmptyStateType, { icon: React.ReactNode; title: string; description: string }> = {
  'no-results': {
    icon: <Search className="h-12 w-12 text-muted-foreground" />,
    title: 'No results found',
    description: 'Try adjusting your filters or search criteria to find what you\'re looking for.',
  },
  'no-listings': {
    icon: <Home className="h-12 w-12 text-muted-foreground" />,
    title: 'No listings available',
    description: 'There are no property listings matching your criteria at the moment. Check back later for new properties.',
  },
  'no-saved-searches': {
    icon: <FilterX className="h-12 w-12 text-muted-foreground" />,
    title: 'No saved searches',
    description: 'Create a saved search to get notified when new properties match your criteria.',
  },
  'no-data': {
    icon: <Inbox className="h-12 w-12 text-muted-foreground" />,
    title: 'No data available',
    description: 'There\'s nothing to display here yet.',
  },
  'not-found': {
    icon: <FileX className="h-12 w-12 text-muted-foreground" />,
    title: 'Not found',
    description: 'The item you\'re looking for doesn\'t exist or has been removed.',
  },
  'custom': {
    icon: <Inbox className="h-12 w-12 text-muted-foreground" />,
    title: 'Empty',
    description: 'No items to display.',
  },
};

/**
 * Empty State Component
 * 
 * Professional empty state component with illustrations and optional actions.
 * Supports multiple pre-configured types or custom content.
 * 
 * @example
 * ```tsx
 * <EmptyState
 *   type="no-results"
 *   action={{ label: 'Clear Filters', onClick: handleClear }}
 * />
 * ```
 */
export default function EmptyState({
  type = 'no-data',
  title,
  description,
  icon,
  action,
  className = '',
  variant = 'default',
}: EmptyStateProps) {
  const config = defaultConfigs[type];
  const displayIcon = icon || config.icon;
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;

  if (variant === 'compact') {
    return (
      <div className={cn('text-center space-y-3 py-8', className)}>
        <div className="mx-auto h-12 w-12 text-muted-foreground">
          {displayIcon}
        </div>
        <div>
          <h3 className="font-semibold mb-1">{displayTitle}</h3>
          <p className="text-sm text-muted-foreground">{displayDescription}</p>
        </div>
        {action && (
          <div className="pt-2">
            {action.href ? (
              <Button asChild size="sm" variant="outline">
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ) : (
              <Button onClick={action.onClick} size="sm" variant="outline">
                {action.label}
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
          <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            {displayIcon}
          </div>
          <div>
            <CardTitle className="mb-2">{displayTitle}</CardTitle>
            <CardDescription className="text-base max-w-md mx-auto">
              {displayDescription}
            </CardDescription>
          </div>
          {action && (
            <div className="pt-2">
              {action.href ? (
                <Button asChild variant="outline">
                  <Link href={action.href}>{action.label}</Link>
                </Button>
              ) : (
                <Button onClick={action.onClick} variant="outline">
                  {action.label}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
