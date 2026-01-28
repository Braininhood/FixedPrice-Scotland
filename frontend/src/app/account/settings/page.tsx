'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Mail, User, Lock, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function AccountSettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/auth/login');
      return;
    }
    setFullName((user.user_metadata?.full_name as string) || '');
  }, [user, authLoading, router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName || undefined },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Profile updated.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Password updated.');
      setNewPassword('');
      setConfirmPassword('');
    } finally {
      setSavingPassword(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-12 flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/account" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Account
          </Link>
        </Button>
      </div>

      <div className="space-y-8">
        <h1 className="text-2xl font-bold">Account Settings</h1>

        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>Update your display name and email is shown for reference.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <p className="text-xs text-muted-foreground">Email cannot be changed here. Contact support if needed.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Display name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  className="max-w-sm"
                />
              </div>
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span className="ml-2">Save profile</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change password
            </CardTitle>
            <CardDescription>Set a new password for your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm"
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" disabled={savingPassword || !newPassword}>
                {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span className="ml-2">Update password</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
