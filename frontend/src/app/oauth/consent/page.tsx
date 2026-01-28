'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

/**
 * OAuth Consent Page
 * 
 * This page handles OAuth authorization consent flow.
 * Supabase redirects here after OAuth provider authorization.
 * 
 * Route: /oauth/consent
 * Configured in Supabase Dashboard → Authentication → URL Configuration
 * 
 * Flow:
 * 1. User clicks OAuth button → redirects to provider (Google/Facebook)
 * 2. User authorizes → provider redirects to Supabase callback
 * 3. Supabase processes → redirects to /oauth/consent with code
 * 4. This page exchanges code for session → redirects to /auth/callback
 */
export default function OAuthConsentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = React.useState<string>('Processing authorization...');

  useEffect(() => {
    const handleOAuthConsent = async () => {
      try {
        // Get OAuth parameters from URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Handle OAuth errors from provider
        if (error) {
          setStatus('error');
          setMessage(errorDescription || error || 'Authorization failed');
          setTimeout(() => {
            router.push('/auth/login');
          }, 3000);
          return;
        }

        // If we have a code, exchange it for a session
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('OAuth exchange error:', exchangeError);
            setStatus('error');
            setMessage(exchangeError.message || 'Failed to complete authorization');
            setTimeout(() => {
              router.push('/auth/login');
            }, 3000);
            return;
          }

          if (data.session) {
            setStatus('success');
            setMessage('Authorization successful! Redirecting...');
            
            // Redirect to callback page to complete the flow
            setTimeout(() => {
              router.push('/auth/callback');
            }, 1500);
          } else {
            setStatus('error');
            setMessage('No session created. Please try again.');
            setTimeout(() => {
              router.push('/auth/login');
            }, 3000);
          }
        } else {
          // No code parameter - might be a direct visit or missing parameters
          // Check if we already have a session
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            // Already authenticated, redirect to dashboard
            router.push('/account');
          } else {
            setStatus('error');
            setMessage('Missing authorization code. Please try logging in again.');
            setTimeout(() => {
              router.push('/auth/login');
            }, 3000);
          }
        }
      } catch (error: any) {
        console.error('OAuth consent error:', error);
        setStatus('error');
        setMessage(error.message || 'An unexpected error occurred');
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      }
    };

    handleOAuthConsent();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">OAuth Authorization</CardTitle>
          <CardDescription className="text-center">
            Processing your authorization request
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground text-center">{message}</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-sm text-muted-foreground text-center">{message}</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-sm text-destructive text-center mb-4">{message}</p>
              <Button onClick={() => router.push('/auth/login')} variant="outline">
                Return to Login
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
