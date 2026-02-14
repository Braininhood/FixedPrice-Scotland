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
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

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

  const navItems = nav.filter(
    (item) => isAdmin || item.href === '/admin' || item.href.startsWith('/admin/listings')
  );

  const NavLinks = () =>
    navItems.map((item) => {
      const isActive =
        pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
      const Icon = item.icon;
      return (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px] ${
            isActive
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Icon className="h-5 w-5 shrink-0" />
          {item.label}
        </Link>
      );
    });

  const SidebarFooter = () => (
    <div className="p-3 border-t border-border space-y-0.5">
      {isAdmin && (
        <>
          <a
            href={apiDocsUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground min-h-[44px] items-center"
          >
            <ExternalLink className="h-4 w-4" />
            API Docs
          </a>
          <a
            href={databaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground min-h-[44px] items-center"
          >
            <ExternalLink className="h-4 w-4" />
            Database (Supabase)
          </a>
        </>
      )}
      <Link
        href="/account"
        className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground min-h-[44px]"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to account
      </Link>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row min-h-[100dvh] bg-background">
      {/* Mobile: menu button + sheet */}
      <div className="lg:hidden flex items-center gap-2 border-b border-border bg-card px-4 py-3 shrink-0">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 min-h-[44px] min-w-[44px]" aria-label="Open admin menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full max-w-[min(100vw,22rem)] overflow-y-auto p-0 flex flex-col">
            <SheetHeader className="p-4 border-b border-border text-left">
              <SheetTitle className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                {isAdmin ? 'Admin' : 'Agent'}
              </SheetTitle>
            </SheetHeader>
            <nav className="flex-1 p-3 space-y-0.5 overflow-auto">
              <NavLinks />
            </nav>
            <SidebarFooter />
          </SheetContent>
        </Sheet>
        <span className="font-semibold text-foreground truncate">
          {isAdmin ? 'Admin' : 'Agent Dashboard'}
        </span>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-border bg-card flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <Link href="/admin" className="flex items-center gap-2 font-semibold text-foreground">
            <Shield className="h-6 w-6 text-primary" />
            <span>{isAdmin ? 'Admin' : 'Agent Dashboard'}</span>
          </Link>
          <p className="text-xs text-muted-foreground mt-1">FixedPrice Scotland</p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-auto min-w-0">
          <NavLinks />
        </nav>
        <SidebarFooter />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto min-w-0">
        <div className="container max-w-6xl w-full py-4 sm:py-6 px-4 sm:px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
