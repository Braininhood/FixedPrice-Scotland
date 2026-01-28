'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import ErrorDisplay from '@/components/ui/error-display';
import { Button } from '@/components/ui/button';
import { Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * 
 * React Error Boundary to catch JavaScript errors anywhere in the child component tree,
 * log those errors, and display a fallback UI instead of crashing the whole app.
 * 
 * Best Practice: Wrap your app or major sections with this component.
 * 
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <YourApp />
 * </ErrorBoundary>
 * ```
 * 
 * @example With custom fallback
 * ```tsx
 * <ErrorBoundary
 *   fallback={<CustomErrorUI />}
 *   onError={(error, errorInfo) => console.error('Caught error:', error)}
 * >
 *   <YourApp />
 * </ErrorBoundary>
 * ```
 */
export default class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // TODO: In production, you might want to log to an error reporting service
    // Example: logErrorToService(error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset error boundary if resetKeys change
    if (hasError && resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );
      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }

    // Reset on any prop change if enabled
    if (hasError && resetOnPropsChange) {
      this.resetErrorBoundary();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="container max-w-4xl mx-auto py-12">
          <ErrorDisplay
            title="Something went wrong"
            message={this.state.error?.message || 'An unexpected error occurred'}
            onRetry={this.resetErrorBoundary}
            retryLabel="Try Again"
            showHomeButton={true}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
