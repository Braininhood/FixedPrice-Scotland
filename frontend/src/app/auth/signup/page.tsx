'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const signupSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: searchParams.get('email') || '',
      password: '',
      confirmPassword: '',
    },
  });

  // If email was passed in URL from login page, set it
  useEffect(() => {
    const email = searchParams.get('email');
    if (email) {
      form.setValue('email', email);
    }
  }, [searchParams, form]);

  // Clear any existing session when signup page loads to allow fresh signup
  useEffect(() => {
    const clearSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Silently sign out to allow new account selection
        await supabase.auth.signOut();
      }
    };
    clearSession();
  }, []);

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    try {
      const { error, data: authData } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Supabase signup error:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          name: error.name,
        });
        
        if (error.status === 429 || error.message.toLowerCase().includes('rate limit')) {
          toast.error('Too many signup attempts', {
            description: 'Rate limit exceeded. This limit is based on your IP address, not email. Please wait approximately 1 hour before trying again. Alternatively, try using a different network or Google signup.',
            duration: 20000,
            action: {
              label: 'Use Google',
              onClick: () => handleOAuthLogin('google'),
            },
          });
        } else if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('user already exists')) {
          toast.error('Email already in use.', {
            description: 'Redirecting to login...',
            action: {
              label: 'Login',
              onClick: () => router.push(`/auth/login?email=${encodeURIComponent(data.email)}`),
            },
          });
          // Auto redirect after 3 seconds
          setTimeout(() => {
            router.push(`/auth/login?email=${encodeURIComponent(data.email)}`);
          }, 3000);
        } else if (error.message.toLowerCase().includes('invalid') && error.message.toLowerCase().includes('email')) {
          toast.error('Invalid email address', {
            description: 'Supabase blocks test email domains (.test, .example, etc.). Please use a real email address like Gmail, Yahoo, or Outlook.',
            duration: 10000,
          });
        } else if (error.status === 500) {
          toast.error('Server error during signup', {
            description: 'This is likely a database trigger issue. Check the browser console (F12) for details. The database trigger that creates user profiles may need to be fixed in Supabase.',
            duration: 15000,
          });
          console.error('TROUBLESHOOTING: If this persists, run FIX-SIGNUP-500-ERROR.sql in Supabase SQL Editor');
        } else {
          toast.error(error.message || 'Failed to create account');
        }
        return;
      }

      if (authData.user && authData.session === null) {
        toast.success('Registration successful!', {
          description: 'Please check your email (including spam folder) to confirm your account. After confirmation, you\'ll receive a welcome email.',
          duration: 10000,
        });
      } else {
        // Call backend onboarding to send welcome email
        try {
          const apiClient = (await import('@/lib/api/client')).default;
          await apiClient.post('/users/onboard');
        } catch (e) {
          console.error('Onboarding call failed:', e);
          // Log but don't block - email might not be configured
        }
        
        toast.success('Successfully registered and logged in!', {
          description: 'Welcome email sent. Please check your inbox (including spam folder).',
        });
        router.push('/account');
      }
    } catch (error: any) {
      console.error('Unexpected signup error:', error);
      toast.error('An unexpected error occurred.', {
        description: error?.message || 'Please check the browser console for details.',
        duration: 10000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google') => {
    try {
      // Sign out any existing session first to force account selection
      await supabase.auth.signOut();
      const baseUrl =
        (typeof window !== 'undefined' && (process.env.NEXT_PUBLIC_APP_URL || window.location.origin)) || '';
      const redirectTo = `${baseUrl}/oauth/consent`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          queryParams: {
            prompt: 'select_account', // Force Google to show account picker
            access_type: 'offline',
          },
        },
      });
      if (error) {
        if (error.message?.includes('provider is not enabled') || error.message?.includes('Unsupported provider')) {
          toast.error(
            `${provider.charAt(0).toUpperCase() + provider.slice(1)} OAuth is not enabled`,
            {
              description: 'Please use email/password signup or contact support to enable OAuth providers.',
            }
          );
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in with OAuth');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
          <CardDescription className="text-center">
            Enter your details to create your account
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button variant="outline" onClick={() => handleOAuthLogin('google')} disabled={isLoading}>
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
            </svg>
            Continue with Google
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or register with email
              </span>
            </div>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 text-center">
          <div className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-primary hover:underline"
            >
              Login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    }>
      <SignupPageContent />
    </Suspense>
  );
}
