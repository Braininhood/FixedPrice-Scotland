'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import apiClient, { getApiOrigin } from '@/lib/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, CreditCard, Activity, Loader2, ArrowRight, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminStats {
  users_count: number;
  listings_count: number;
  subscriptions_count: number;
  active_subscriptions_count: number;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      apiClient.get<{ role?: string }>('/users/me')
        .then((res) => {
          const role = res.data?.role;
          setUserRole(role || null);
          // Only fetch admin stats if user is admin
          if (role === 'admin') {
            apiClient
              .get<AdminStats>('/admin/stats')
              .then((res) => setStats(res.data))
              .catch(() => setError('Failed to load stats'))
              .finally(() => setLoading(false));
          } else {
            // Agent - no stats needed, just show loading done
            setLoading(false);
          }
        })
        .catch(() => {
          setError('Failed to load user info');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Agent view - redirect to listings dashboard
  if (userRole === 'agent') {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your listings and view analytics</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Quick Access
            </CardTitle>
            <CardDescription>Navigate to your listings dashboard for analytics and insights</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg">
              <Link href="/admin/listings">
                <Building2 className="h-4 w-4 mr-2" />
                Go to Listings Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || (!stats && userRole === 'admin')) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6 text-center text-destructive">
        {error || 'Failed to load dashboard'}
      </div>
    );
  }

  if (!stats) {
    return null; // Still loading or not admin
  }

  const cards = [
    {
      title: 'Total Users',
      value: stats.users_count,
      icon: Users,
      href: '/admin/users',
      description: 'User accounts',
    },
    {
      title: 'Listings',
      value: stats.listings_count,
      icon: Building2,
      href: '/admin/listings',
      description: 'Property listings',
    },
    {
      title: 'Subscriptions',
      value: stats.subscriptions_count,
      icon: CreditCard,
      href: '/admin/subscriptions',
      description: `${stats.active_subscriptions_count} active`,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Platform overview and quick access</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.href} href={c.href}>
              <Card className="h-full transition-colors hover:bg-muted/50 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{c.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
                  <Button variant="ghost" size="sm" className="mt-2 -ml-2 text-primary">
                    Manage <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Quick actions
          </CardTitle>
          <CardDescription>Manage users, listings, and subscriptions from the sidebar.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/admin/users">Users</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/listings">Listings</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/subscriptions">Subscriptions</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={`${getApiOrigin()}/docs`} target="_blank" rel="noopener noreferrer">
              API Docs
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
