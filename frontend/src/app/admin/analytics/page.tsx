'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BarChart3, Users, Building2, CreditCard } from 'lucide-react';

interface Analytics {
  users_total: number;
  users_by_role: { admin: number; agent: number; buyer: number };
  listings_total: number;
  listings_active: number;
  subscriptions_total: number;
  subscriptions_by_status: Record<string, number>;
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is admin - redirect non-admins
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/auth/login?redirect=/admin/analytics');
      return;
    }
    apiClient
      .get<{ role?: string }>('/users/me')
      .then((res) => {
        const r = res.data?.role ?? null;
        setRole(r ?? null);
        if (r !== 'admin') {
          router.replace('/admin/listings');
        }
      })
      .catch(() => router.replace('/admin/listings'))
      .finally(() => setChecking(false));
  }, [user, authLoading, router]);

  useEffect(() => {
    if (role === 'admin') {
      apiClient
        .get<Analytics>('/admin/analytics')
        .then((res) => setData(res.data))
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    }
  }, [role]);

  // Show loading while checking role
  if (authLoading || checking || role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6 text-center text-destructive">
        Failed to load analytics
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">Platform statistics and activity</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total users</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.users_total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Admin: {data.users_by_role.admin} · Agent: {data.users_by_role.agent} · Buyer: {data.users_by_role.buyer}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Listings</CardTitle>
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.listings_total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.listings_active} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Subscriptions</CardTitle>
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.subscriptions_total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              By status: {Object.entries(data.subscriptions_by_status).map(([k, v]) => `${k}: ${v}`).join(', ') || '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Users by role</CardTitle>
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Admin</span>
                <span className="font-semibold">{data.users_by_role.admin}</span>
              </div>
              <div className="flex justify-between">
                <span>Agent</span>
                <span className="font-semibold">{data.users_by_role.agent}</span>
              </div>
              <div className="flex justify-between">
                <span>Buyer</span>
                <span className="font-semibold">{data.users_by_role.buyer}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
