'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, LayoutDashboard, Settings, Menu } from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full max-w-[100vw] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 min-w-0">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-2">
          <div className="flex min-w-0 flex-shrink-0 items-center gap-4 md:gap-8">
            <Link href="/" className="flex items-center gap-2 min-w-0 shrink-0">
              <span className="truncate font-bold text-base sm:text-lg md:text-xl text-primary">
                FixedPrice Scotland
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-5 lg:gap-8 shrink-0">
              <Link href="/listings" className="text-sm font-medium whitespace-nowrap transition-colors hover:text-primary">
                Listings
              </Link>
              <Link href="/pricing" className="text-sm font-medium whitespace-nowrap transition-colors hover:text-primary">
                Pricing
              </Link>
              <Link href="/about" className="text-sm font-medium whitespace-nowrap transition-colors hover:text-primary">
                About
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full">
                    <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
                      <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email || ''} />
                      <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none truncate">{user.user_metadata?.full_name || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Account</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/auth/signup">Get Started</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10" aria-label="Open menu">
                    <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full max-w-[min(100vw,22rem)]">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-4 mt-8">
                    <Link href="/listings" className="text-lg font-medium py-2">Listings</Link>
                    <Link href="/pricing" className="text-lg font-medium py-2">Pricing</Link>
                    <Link href="/about" className="text-lg font-medium py-2">About</Link>
                    {!user && (
                      <>
                        <hr className="my-2" />
                        <Link href="/auth/login" className="text-lg font-medium py-2">Sign In</Link>
                        <Link href="/auth/signup" className="text-lg font-medium py-2">Get Started</Link>
                      </>
                    )}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
