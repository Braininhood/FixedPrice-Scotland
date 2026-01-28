'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import apiClient, { getApiOrigin } from '@/lib/api/client';
import {
  LayoutDashboard,
  Users,
  Building2,
  CreditCard,
  ChevronLeft,
  Shield,
  Loader2,
  BarChart3,
  ExternalLink,
} from 'lucide-react';

const nav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/listings', label: 'Listings', icon: Building2 },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
];

const apiDocsUrl = () => `${getApiOrigin()}/docs`;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
const databaseUrl = projectRef ? `https://supabase.com/dashboard/project/${projectRef}` : 'https://supabase.com/dashboard';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading: authLoading } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/auth/login?redirect=/admin');
      return;
    }
    apiClient
      .get<{ role?: string }>('/users/me')
      .then((res) => {
        const r = res.data?.role ?? null;
        setRole(r ?? null);
        if (r !== 'admin' && r !== 'agent') {
          router.replace('/account');
        }
      })
      .catch(() => router.replace('/account'))
      .finally(() => setChecking(false));
  }, [user, authLoading, router]);

  const isAdmin = role === 'admin';
  const isAgent = role === 'agent';
  
  // Redirect agents away from admin-only pages
  useEffect(() => {
    if (!authLoading && !checking && isAgent && pathname) {
      const adminOnlyPaths = ['/admin/users', '/admin/subscriptions', '/admin/analytics'];
      if (adminOnlyPaths.some(path => pathname.startsWith(path))) {
        router.replace('/admin/listings');
      }
    }
  }, [authLoading, checking, isAgent, pathname, router]);
  
  if (authLoading || checking || (!isAdmin && !isAgent)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-0px)] bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <Link href="/admin" className="flex items-center gap-2 font-semibold text-foreground">
            <Shield className="h-6 w-6 text-primary" />
            <span>{isAdmin ? 'Admin' : 'Agent Dashboard'}</span>
          </Link>
          <p className="text-xs text-muted-foreground mt-1">FixedPrice Scotland</p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {nav
            .filter((item) => isAdmin || item.href === '/admin' || item.href.startsWith('/admin/listings'))
            .map((item) => {
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
        </nav>
        <div className="p-3 border-t border-border space-y-0.5">
          {isAdmin && (
            <>
              <a
                href={apiDocsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4" />
                API Docs
              </a>
              <a
                href={databaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4" />
                Database (Supabase)
              </a>
            </>
          )}
          <Link
            href="/account"
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to account
          </Link>
        </div>
      </aside>
      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="container max-w-6xl py-6 px-4">
          {children}
        </div>
      </main>
    </div>
  );
}
