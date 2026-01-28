'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireSubscription?: boolean;
}

/**
 * Protected Route Component
 * 
 * Wraps pages/components that require authentication.
 * Redirects to login if user is not authenticated.
 * 
 * Usage:
 * ```tsx
 * <ProtectedRoute>
 *   <YourProtectedContent />
 * </ProtectedRoute>
 * ```
 */
export default function ProtectedRoute({ 
  children, 
  redirectTo,
  requireSubscription = false 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      const redirect = redirectTo || `/auth/login?redirect=${encodeURIComponent(pathname)}`;
      router.push(redirect);
    }
  }, [user, isLoading, router, pathname, redirectTo]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show nothing while redirecting
  if (!user) {
    return null;
  }

  // TODO: Add subscription check if requireSubscription is true
  // This would check if user has active subscription and redirect to pricing if not

  return <>{children}</>;
}
