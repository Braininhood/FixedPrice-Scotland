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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Users, Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone?: string;
  created_at?: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [addForm, setAddForm] = useState({ email: '', password: '', full_name: '', role: 'buyer' });
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', role: '' });
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Check if user is admin - redirect agents
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/auth/login?redirect=/admin/users');
      return;
    }
    apiClient
      .get<{ role?: string }>('/users/me')
      .then((res) => {
        const r = res.data?.role ?? null;
        setRole(r ?? null);
        if (r !== 'admin') {
          // Redirect non-admins away from this admin-only page
          router.replace('/admin/listings');
        }
      })
      .catch(() => router.replace('/admin/listings'))
      .finally(() => setChecking(false));
  }, [user, authLoading, router]);

  const fetchUsers = () => {
    setLoading(true);
    apiClient
      .get<{ users: AdminUser[] }>('/users/')
      .then((res) => setUsers(res.data.users ?? []))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = (userId: string, role: string) => {
    setUpdatingId(userId);
    apiClient
      .patch(`/users/${userId}/role`, { role })
      .then(() => {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
        toast.success('Role updated');
      })
      .catch((err) => toast.error(getApiErrorMessage(err.response?.data?.detail, 'Failed to update role')))
      .finally(() => setUpdatingId(null));
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    
    setDeleting(true);
    try {
      await apiClient.delete(`/users/${deleteUser.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id));
      toast.success('User deleted successfully');
      setDeleteUser(null);
    } catch (err: any) {
      toast.error(getApiErrorMessage(err.response?.data?.detail, 'Failed to delete user'));
    } finally {
      setDeleting(false);
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.email.trim() || !addForm.password.trim()) {
      toast.error('Email and password required');
      return;
    }
    setSaving(true);
    apiClient
      .post('/users/', {
        email: addForm.email,
        password: addForm.password,
        full_name: addForm.full_name || 'User',
        role: addForm.role,
      })
      .then(() => {
        toast.success('User created');
        setAddOpen(false);
        setAddForm({ email: '', password: '', full_name: '', role: 'buyer' });
        fetchUsers();
      })
      .catch((err) => toast.error(getApiErrorMessage(err.response?.data?.detail, 'Failed to create user')))
      .finally(() => setSaving(false));
  };

  const handleEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setSaving(true);
    apiClient
      .put(`/users/${editUser.id}`, {
        full_name: editForm.full_name || undefined,
        phone: editForm.phone || undefined,
        role: editForm.role || undefined,
      })
      .then(() => {
        toast.success('User updated');
        setEditUser(null);
        fetchUsers();
      })
      .catch((err) => toast.error(getApiErrorMessage(err.response?.data?.detail, 'Failed to update user')))
      .finally(() => setSaving(false));
  };

  const openEdit = (u: AdminUser) => {
    setEditUser(u);
    setEditForm({ full_name: u.full_name || '', phone: u.phone || '', role: u.role });
  };

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

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

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-500/15 text-red-700 border-red-200',
      agent: 'bg-purple-500/15 text-purple-700 border-purple-200',
      buyer: 'bg-blue-500/15 text-blue-700 border-blue-200',
    };
    return (
      <Badge variant="outline" className={colors[role] ?? ''}>
        {role}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-1">Add, edit, and manage user accounts</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add user
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                All users
              </CardTitle>
              <CardDescription>Search, change roles, or edit profile.</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.email}</TableCell>
                      <TableCell>{u.full_name || '—'}</TableCell>
                      <TableCell>{u.phone || '—'}</TableCell>
                      <TableCell>{roleBadge(u.role)}</TableCell>
                      <TableCell>{formatDate(u.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {u.id !== user?.id && u.role !== 'admin' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteUser(u)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Select
                            value={u.role}
                            onValueChange={(value) => handleRoleChange(u.id, value)}
                            disabled={updatingId === u.id}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="agent">Agent</SelectItem>
                              <SelectItem value="buyer">Buyer</SelectItem>
                            </SelectContent>
                          </Select>
                          {updatingId === u.id && (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add user dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add user</DialogTitle>
            <DialogDescription>Create a new user. They can log in with this email and password.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <div>
              <Label>Full name</Label>
              <Input
                value={addForm.full_name}
                onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                placeholder="User"
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={addForm.role} onValueChange={(v) => setAddForm({ ...addForm, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buyer">Buyer</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create user'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit user dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
            <DialogDescription>Update name, phone, and role. Email cannot be changed here.</DialogDescription>
          </DialogHeader>
          {editUser && (
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={editUser.email} disabled className="bg-muted" />
              </div>
              <div>
                <Label>Full name</Label>
                <Input
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="+44 ..."
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buyer">Buyer</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditUser(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
        </Dialog>

        {/* Delete confirmation dialog */}
        <Dialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>{deleteUser?.email}</strong>? This action cannot be undone.
                <br />
                <br />
                This will:
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>Delete the user account and profile</li>
                  <li>Delete all subscriptions and saved searches</li>
                  <li>Remove user association from listings (listings will remain)</li>
                </ul>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteUser(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete User'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
