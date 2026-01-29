'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search,
  Bell,
  Edit,
  Trash2,
  Plus,
  ArrowLeft,
  Loader2,
  MapPin,
  PoundSterling,
  Home,
  CheckCircle2,
  X,
  AlertCircle,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";

interface SavedSearch {
  id: string;
  name: string;
  max_budget?: number;
  postcode?: string;
  city?: string;
  region?: string;
  confidence_level?: string;
  is_active: boolean;
  last_notified_at?: string;
  created_at: string;
}

const searchSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  max_budget: z.number().positive().optional().or(z.literal('')),
  postcode: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  confidence_level: z.enum(['explicit', 'explicit_and_likely']).optional(),
  is_active: z.boolean(),
});

type SearchFormValues = z.infer<typeof searchSchema>;

export default function SavedSearchesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      name: '',
      max_budget: undefined,
      postcode: '',
      city: '',
      region: '',
      confidence_level: undefined,
      is_active: true,
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/account/saved-searches');
      return;
    }

    if (user) {
      fetchSearches();
    }
  }, [user, authLoading, router]);

  const fetchSearches = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/saved-searches/');
      setSearches(response.data || []);
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error('Subscription Required', {
          description: 'You need an active subscription to use saved searches.',
        });
        router.push('/pricing');
      } else {
        console.error('Error fetching saved searches:', error);
        toast.error('Failed to load saved searches');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (data: SearchFormValues) => {
    try {
      const payload = {
        ...data,
        max_budget: data.max_budget || undefined,
        postcode: data.postcode || undefined,
        city: data.city || undefined,
        region: data.region || undefined,
        confidence_level: data.confidence_level || undefined,
      };
      
      await apiClient.post('/saved-searches/', payload);
      toast.success('Saved search created!');
      setIsDialogOpen(false);
      form.reset();
      await fetchSearches();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to create saved search';
      toast.error('Error', { description: errorMessage });
    }
  };

  const handleUpdate = async (data: SearchFormValues) => {
    if (!editingSearch) return;

    try {
      const payload = {
        ...data,
        max_budget: data.max_budget || undefined,
        postcode: data.postcode || undefined,
        city: data.city || undefined,
        region: data.region || undefined,
        confidence_level: data.confidence_level || undefined,
      };
      
      await apiClient.put(`/saved-searches/${editingSearch.id}`, payload);
      toast.success('Saved search updated!');
      setIsDialogOpen(false);
      setEditingSearch(null);
      form.reset();
      await fetchSearches();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to update saved search';
      toast.error('Error', { description: errorMessage });
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await apiClient.delete(`/saved-searches/${id}`);
      toast.success('Saved search deleted');
      await fetchSearches();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to delete saved search';
      toast.error('Error', { description: errorMessage });
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (search: SavedSearch) => {
    try {
      await apiClient.put(`/saved-searches/${search.id}`, {
        is_active: !search.is_active
      });
      toast.success(`Search ${!search.is_active ? 'activated' : 'paused'}`);
      await fetchSearches();
    } catch (error: any) {
      toast.error('Failed to update search');
    }
  };

  const openEditDialog = (search: SavedSearch) => {
    setEditingSearch(search);
    form.reset({
      name: search.name,
      max_budget: search.max_budget || undefined,
      postcode: search.postcode || '',
      city: search.city || '',
      region: search.region || '',
      confidence_level: search.confidence_level as 'explicit' | 'explicit_and_likely' | undefined,
      is_active: search.is_active,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingSearch(null);
    form.reset({
      name: '',
      max_budget: undefined,
      postcode: '',
      city: '',
      region: '',
      confidence_level: undefined,
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const getSearchUrl = (search: SavedSearch) => {
    const params = new URLSearchParams();
    if (search.max_budget) params.set('max_budget', search.max_budget.toString());
    if (search.postcode) params.set('postcode', search.postcode);
    if (search.city) params.set('city', search.city);
    if (search.confidence_level) params.set('confidence', search.confidence_level);
    return `/listings?${params.toString()}`;
  };

  if (authLoading || isLoading) {
    return (
      <div className="container max-w-6xl mx-auto py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-12">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/account">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Account
          </Link>
        </Button>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          New Saved Search
        </Button>
      </div>

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">Saved Searches</h1>
          <p className="text-muted-foreground">
            Save your property search criteria and get instant email alerts when new matches are found.
          </p>
        </div>

        {/* Saved Searches List */}
        {searches.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Your Saved Searches</CardTitle>
              <CardDescription>
                {searches.filter(s => s.is_active).length} active, {searches.filter(s => !s.is_active).length} paused
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {searches.map((search) => (
                  <div
                    key={search.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{search.name}</h3>
                          <div className="flex items-center gap-2">
                            {search.is_active ? (
                              <Badge className="bg-green-500">
                                <Bell className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Paused</Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(search)}
                              className="h-6 px-2"
                            >
                              {search.is_active ? (
                                <ToggleRight className="h-4 w-4" />
                              ) : (
                                <ToggleLeft className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                          {search.max_budget && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <PoundSterling className="h-4 w-4" />
                              <span>Up to £{search.max_budget.toLocaleString()}</span>
                            </div>
                          )}
                          {search.postcode && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Home className="h-4 w-4" />
                              <span>{search.postcode}</span>
                            </div>
                          )}
                          {search.city && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{search.city}</span>
                            </div>
                          )}
                          {search.confidence_level && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="capitalize">
                                {search.confidence_level.replace('_', ' ')}
                              </span>
                            </div>
                          )}
                        </div>

                        {search.last_notified_at && (
                          <div className="text-xs text-muted-foreground">
                            Last alert: {new Date(search.last_notified_at).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={getSearchUrl(search)}>
                            <Search className="h-4 w-4 mr-2" />
                            View Results
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEditDialog(search)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(search.id)}
                          disabled={deletingId === search.id}
                        >
                          {deletingId === search.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">No Saved Searches Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first saved search to get instant email alerts when new properties match your criteria.
                  </p>
                  <Button onClick={openCreateDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Saved Search
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSearch ? 'Edit Saved Search' : 'Create Saved Search'}
              </DialogTitle>
              <DialogDescription>
                Set up your property search criteria. We'll send you email alerts when new listings match.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(editingSearch ? handleUpdate : handleCreate)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Search Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Edinburgh 2-bed under £200k" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="max_budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Budget (£)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 200000"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="postcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postcode</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., EH1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Edinburgh" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Region</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Lothian" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="confidence_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Classification Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="All confidence levels" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="explicit">Explicit Fixed Price Only</SelectItem>
                          <SelectItem value="explicit_and_likely">Explicit + Likely Fixed Price</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Email Alerts</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Receive email notifications when new listings match this search
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingSearch(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingSearch ? 'Update Search' : 'Create Search'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
