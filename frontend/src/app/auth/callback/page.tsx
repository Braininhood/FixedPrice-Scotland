'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // The `supabase.auth.onAuthStateChange` listener in `AuthContext` 
      // will handle the state update once the session is established.
      // We just need to make sure the user is redirected to the right place.
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Check if this is an email confirmation (type=signup in URL params)
        const type = searchParams.get('type');
        const isEmailConfirmation = type === 'signup' || searchParams.get('token_hash');
        
        // Send welcome email if this is a new signup/email confirmation
        if (isEmailConfirmation) {
          try {
            const apiClient = (await import('@/lib/api/client')).default;
            await apiClient.post('/users/onboard');
          } catch (e) {
            console.error('Failed to send welcome email:', e);
            // Don't block the flow if email fails
          }
        }
        
        // Redirect to account dashboard after successful authentication
        router.push('/account');
      } else {
        router.push('/auth/login');
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}
