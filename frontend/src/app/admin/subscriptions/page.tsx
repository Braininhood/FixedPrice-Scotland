'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import apiClient, { getApiErrorMessage } from '@/lib/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreditCard, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface ShortUser {
  id: string;
  email: string;
  full_name: string;
}

interface SubRow {
  id: string;
  user_id: string;
  plan_type: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  user?: { email?: string; full_name?: string };
}

const PAGE_SIZE = 20;
const planLabels: Record<string, string> = {
  buyer_monthly: 'Buyer Monthly',
  buyer_yearly: 'Buyer Yearly',
  agent_verification: 'Agent Verification',
};

export default function AdminSubscriptionsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [users, setUsers] = useState<ShortUser[]>([]);
  const [addForm, setAddForm] = useState({ user_id: '', plan_type: 'buyer_monthly' });
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Check if user is admin - redirect non-admins
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/auth/login?redirect=/admin/subscriptions');
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

  const fetchSubs = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('skip', String(page * PAGE_SIZE));
    params.set('limit', String(PAGE_SIZE));
    if (statusFilter) params.set('status_filter', statusFilter);
    apiClient
      .get<{ subscriptions: SubRow[]; total: number }>(`/subscriptions/all?${params.toString()}`)
      .then((res) => {
        setSubs(res.data.subscriptions ?? []);
        setTotal(res.data.total ?? 0);
      })
      .catch(() => toast.error('Failed to load subscriptions'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (role === 'admin') {
      fetchSubs();
    }
  }, [page, statusFilter, role]);

  useEffect(() => {
    if (addOpen) {
      apiClient.get<{ users: ShortUser[] }>('/users/').then((r) => setUsers(r.data.users ?? []));
    }
  }, [addOpen]);

  const handleAddSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.user_id) {
      toast.error('Select a user');
      return;
    }
    setSaving(true);
    apiClient
      .post('/subscriptions/', { user_id: addForm.user_id, plan_type: addForm.plan_type })
      .then(() => {
        toast.success('Subscription created');
        setAddOpen(false);
        setAddForm({ user_id: '', plan_type: 'buyer_monthly' });
        fetchSubs();
      })
      .catch((err) => toast.error(getApiErrorMessage(err.response?.data?.detail, 'Failed to create subscription')))
      .finally(() => setSaving(false));
  };

  const handleUpdateStatus = (id: string, status: string) => {
    setUpdatingId(id);
    apiClient
      .patch(`/subscriptions/${id}`, { status })
      .then(() => {
        toast.success('Status updated');
        fetchSubs();
      })
      .catch((err) => toast.error(getApiErrorMessage(err.response?.data?.detail, 'Failed to update')))
      .finally(() => setUpdatingId(null));
  };

  const handleCancelAtEnd = (id: string) => {
    setUpdatingId(id);
    apiClient
      .patch(`/subscriptions/${id}`, { cancel_at_period_end: true })
      .then(() => {
        toast.success('Subscription will cancel at period end');
        fetchSubs();
      })
      .catch((err) => toast.error(getApiErrorMessage(err.response?.data?.detail, 'Failed')))
      .finally(() => setUpdatingId(null));
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground mt-1">Add or manage subscriptions for any user</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add subscription
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            All subscriptions
          </CardTitle>
          <CardDescription>Filter by status. Total and active counts are on the dashboard.</CardDescription>
          <div className="pt-2">
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="canceled">Canceled</option>
              <option value="past_due">Past due</option>
              <option value="trialing">Trialing</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Period end</TableHead>
                    <TableHead>Cancel at end</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No subscriptions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    subs.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <div className="font-medium">{s.user?.email ?? s.user_id}</div>
                          {s.user?.full_name && (
                            <div className="text-xs text-muted-foreground">{s.user.full_name}</div>
                          )}
                        </TableCell>
                        <TableCell>{planLabels[s.plan_type] ?? s.plan_type}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              s.status === 'active' ? 'default' : s.status === 'canceled' ? 'secondary' : 'outline'
                            }
                          >
                            {s.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(s.current_period_end)}</TableCell>
                        <TableCell>{s.cancel_at_period_end ? 'Yes' : 'No'}</TableCell>
                        <TableCell>{formatDate(s.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Select
                              value={s.status}
                              onValueChange={(v) => handleUpdateStatus(s.id, v)}
                              disabled={updatingId === s.id}
                            >
                              <SelectTrigger className="w-[110px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="canceled">Canceled</SelectItem>
                                <SelectItem value="past_due">Past due</SelectItem>
                                <SelectItem value="trialing">Trialing</SelectItem>
                              </SelectContent>
                            </Select>
                            {s.status === 'active' && !s.cancel_at_period_end && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelAtEnd(s.id)}
                                disabled={updatingId === s.id}
                              >
                                Cancel at end
                              </Button>
                            )}
                            {updatingId === s.id && (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages} ({total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add subscription</DialogTitle>
            <DialogDescription>Assign a subscription plan to a user.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubscription} className="space-y-4">
            <div>
              <Label>User</Label>
              <Select
                value={addForm.user_id}
                onValueChange={(v) => setAddForm({ ...addForm, user_id: v })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.email} ({u.full_name || '—'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Plan</Label>
              <Select
                value={addForm.plan_type}
                onValueChange={(v) => setAddForm({ ...addForm, plan_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buyer_monthly">Buyer Monthly</SelectItem>
                  <SelectItem value="buyer_yearly">Buyer Yearly</SelectItem>
                  <SelectItem value="agent_verification">Agent Verification</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
