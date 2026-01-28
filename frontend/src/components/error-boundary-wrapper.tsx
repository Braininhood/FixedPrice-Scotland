'use client';

import React from 'react';
import ErrorBoundary from './error-boundary';

interface ErrorBoundaryWrapperProps {
  children: React.ReactNode;
}

/**
 * Client-side wrapper for ErrorBoundary
 * 
 * This allows ErrorBoundary (a class component) to be used
 * in server components like the root layout.
 */
export default function ErrorBoundaryWrapper({ children }: ErrorBoundaryWrapperProps) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
          console.error('ErrorBoundary caught:', error, errorInfo);
        }
        // TODO: In production, log to error reporting service
        // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
