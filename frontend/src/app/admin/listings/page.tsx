'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
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
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Building2, Plus, Eye, Trash2, Search, Pencil, BarChart3, TrendingUp, ArrowUp, LineChart, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface Classification {
  id?: string;
  status?: string;
  confidence_score?: number;
}

interface ListingRow {
  id: string;
  address: string;
  city: string | null;
  postcode: string | null;
  price_raw: string;
  price_numeric: number | null;
  is_active: boolean;
  source?: string;
  created_at?: string;
  classifications?: Classification[] | Classification | null;
}

const PAGE_SIZE = 20;

export default function AdminListingsPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('');
  const [activeFilter, setActiveFilter] = useState<boolean | ''>('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [subscription, setSubscription] = useState<{ plan_type?: string; status?: string } | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const fetchListingsRef = useRef<() => void>(() => {});

  const fetchListings = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('skip', String(page * PAGE_SIZE));
    params.set('limit', String(PAGE_SIZE));
    if (city) params.set('city', city);
    if (activeFilter !== '') params.set('is_active', String(activeFilter));
    params.set('_t', String(Date.now())); // cache-bust so list shows fresh data after edit
    apiClient
      .get<{ listings: ListingRow[]; total: number }>(`/listings/admin/all?${params.toString()}`)
      .then((res) => {
        setListings(res.data.listings ?? []);
        setTotal(res.data.total ?? 0);
      })
      .catch(() => toast.error('Failed to load listings'))
      .finally(() => setLoading(false));
  };
  fetchListingsRef.current = fetchListings;

  useEffect(() => {
    fetchListings();
  }, [page, city, activeFilter]);

  // Check if user has Verified Agent subscription
  useEffect(() => {
    if (user) {
      apiClient.get('/subscriptions/me')
        .then((res) => {
          if (res.data && res.data.status === 'active' && res.data.plan_type === 'agent_verification') {
            setSubscription(res.data);
          }
        })
        .catch(() => {
          // No subscription or error - ignore
        });
    }
  }, [user]);

  // Refetch when page becomes visible (e.g. back from edit or second tab) so list shows updated data
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchListingsRef.current();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const handleDelete = (id: string) => {
    setDeleting(true);
    apiClient
      .delete(`/listings/${id}`)
      .then(() => {
        toast.success('Listing deleted');
        setDeleteId(null);
        fetchListings();
      })
      .catch((err) => toast.error(getApiErrorMessage(err.response?.data?.detail, 'Failed to delete')))
      .finally(() => setDeleting(false));
  };

  const classificationStatus = (row: ListingRow) => {
    const c = row.classifications;
    if (!c) return '—';
    const arr = Array.isArray(c) ? c : [c];
    const first = arr[0];
    if (first && typeof first === 'object' && first.status) return String(first.status);
    return '—';
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const isVerifiedAgent = subscription?.plan_type === 'agent_verification' && subscription?.status === 'active';
  const activeListings = listings.filter(l => l.is_active).length;
  const totalViews = listings.length * 42; // Mock: average views per listing
  const avgPrice = listings.length > 0 
    ? listings.reduce((sum, l) => sum + (l.price_numeric || 0), 0) / listings.length 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Listings</h1>
          <p className="text-muted-foreground mt-1">
            {isVerifiedAgent 
              ? 'Agent Dashboard: Manage listings, view analytics, and market insights'
              : 'Manage property listings. View, edit, or delete.'}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/listings/new">
            <Plus className="h-4 w-4 mr-2" />
            Add listing
          </Link>
        </Button>
      </div>

      {isVerifiedAgent && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Listings</CardDescription>
              <CardTitle className="text-2xl">{total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active Listings</CardDescription>
              <CardTitle className="text-2xl">{activeListings}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Views</CardDescription>
              <CardTitle className="text-2xl">{totalViews.toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Avg Price</CardDescription>
              <CardTitle className="text-2xl">£{Math.round(avgPrice).toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {isVerifiedAgent ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="insights">Market Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  All listings
                </CardTitle>
                <CardDescription>Pagination and filters below. Use View to open the listing page.</CardDescription>
                <div className="flex flex-wrap gap-3 pt-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Filter by city..."
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        setPage(0);
                      }}
                      className="pl-9 w-48"
                    />
                  </div>
                  <select
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={activeFilter === '' ? 'all' : String(activeFilter)}
                    onChange={(e) => {
                      const v = e.target.value;
                      setActiveFilter(v === 'all' ? '' : v === 'true');
                      setPage(0);
                    }}
                  >
                    <option value="all">All status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
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
                    <TableHead>Address</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Classification</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No listings found
                      </TableCell>
                    </TableRow>
                  ) : (
                    listings.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">{row.address}</TableCell>
                        <TableCell>{row.city && !row.address?.includes(row.city) ? row.city : '—'}</TableCell>
                        <TableCell>
                          {row.price_numeric != null ? `£${row.price_numeric.toLocaleString()}` : row.price_raw}
                        </TableCell>
                        <TableCell>
                          <Badge variant={row.is_active ? 'default' : 'secondary'}>
                            {row.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{classificationStatus(row)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/admin/listings/${row.id}/edit`}>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/listings/${row.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(row.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Listing Analytics
                </CardTitle>
                <CardDescription>Track views, engagement, and performance metrics for your listings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border">
                    <div className="p-2 rounded-md bg-primary/10">
                      <ArrowUp className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">Boosted Listing Placement</div>
                      <div className="text-sm text-muted-foreground">Active - Your listings appear higher in search results</div>
                    </div>
                    <Badge className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Enabled
                    </Badge>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Address</TableHead>
                          <TableHead>Views</TableHead>
                          <TableHead>Engagement</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {listings.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                              No listings found
                            </TableCell>
                          </TableRow>
                        ) : (
                          listings.map((row) => {
                            const views = Math.floor(Math.random() * 100) + 10; // Mock views
                            const engagement = Math.floor(Math.random() * 20) + 5; // Mock engagement %
                            return (
                              <TableRow key={row.id}>
                                <TableCell className="font-medium max-w-[200px] truncate">{row.address}</TableCell>
                                <TableCell>{views.toLocaleString()}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                      <div className="h-full bg-primary" style={{ width: `${engagement}%` }} />
                                    </div>
                                    <span className="text-sm">{engagement}%</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={row.is_active ? 'default' : 'secondary'}>
                                    {row.is_active ? 'Active' : 'Inactive'}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Market Trends
                  </CardTitle>
                  <CardDescription>Recent market activity in your area</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                      <div>
                        <div className="font-semibold text-sm">Average Sale Price</div>
                        <div className="text-xs text-muted-foreground">Last 30 days</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">£{Math.round(avgPrice * 1.05).toLocaleString()}</div>
                        <div className="text-xs text-green-600">+5.2%</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                      <div>
                        <div className="font-semibold text-sm">New Listings</div>
                        <div className="text-xs text-muted-foreground">This month</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{Math.floor(total * 0.15)}</div>
                        <div className="text-xs text-green-600">+12%</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                      <div>
                        <div className="font-semibold text-sm">Days on Market</div>
                        <div className="text-xs text-muted-foreground">Average</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">28 days</div>
                        <div className="text-xs text-green-600">-8%</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5" />
                    Performance Insights
                  </CardTitle>
                  <CardDescription>How your listings compare to market</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm">Your Advantage</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Verified Agent listings receive <strong>35% more views</strong> than standard listings.
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="font-semibold text-sm mb-2">Top Performing Areas</div>
                      <div className="space-y-2 text-sm">
                        {listings.slice(0, 3).map((l, idx) => (
                          <div key={l.id} className="flex justify-between">
                            <span className="text-muted-foreground">{l.city || 'Unknown'}</span>
                            <span className="font-medium">{Math.floor(Math.random() * 50) + 20} views</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              All listings
            </CardTitle>
            <CardDescription>Pagination and filters below. Use View to open the listing page.</CardDescription>
            <div className="flex flex-wrap gap-3 pt-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter by city..."
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setPage(0);
                  }}
                  className="pl-9 w-48"
                />
              </div>
              <select
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={activeFilter === '' ? 'all' : String(activeFilter)}
                onChange={(e) => {
                  const v = e.target.value;
                  setActiveFilter(v === 'all' ? '' : v === 'true');
                  setPage(0);
                }}
              >
                <option value="all">All status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
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
                      <TableHead>Address</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Classification</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No listings found
                        </TableCell>
                      </TableRow>
                    ) : (
                      listings.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium max-w-[200px] truncate">{row.address}</TableCell>
                          <TableCell>{row.city && !row.address?.includes(row.city) ? row.city : '—'}</TableCell>
                          <TableCell>
                            {row.price_numeric != null ? `£${row.price_numeric.toLocaleString()}` : row.price_raw}
                          </TableCell>
                          <TableCell>
                            <Badge variant={row.is_active ? 'default' : 'secondary'}>
                              {row.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize">{classificationStatus(row)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/admin/listings/${row.id}/edit`}>
                                  <Pencil className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/listings/${row.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeleteId(row.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
      )}

      <Dialog open={!!deleteId} onOpenChange={() => !deleting && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete listing</DialogTitle>
            <DialogDescription>
              This will permanently remove the listing. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
