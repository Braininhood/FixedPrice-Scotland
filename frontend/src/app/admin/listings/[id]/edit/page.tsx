'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import apiClient, { getApiErrorMessage } from '@/lib/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ListingPhotoUpload } from '@/components/listings/ListingPhotoUpload';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/** Parse a number from display price text (e.g. "£128,000" or "128000"). */
function parsePriceFromRaw(raw: string): number | undefined {
  const cleaned = raw.trim().replace(/[£,\s]/g, '').replace(/^[^0-9]*/i, '');
  if (!cleaned) return undefined;
  const n = parseInt(cleaned, 10);
  return Number.isNaN(n) ? undefined : n;
}

export default function AdminListingEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    listing_url: '',
    source: 'manual',
    address: '',
    postcode: '',
    city: '',
    region: '',
    price_raw: '',
    price_numeric: undefined as number | undefined,
    description: '',
    agent_name: '',
    agent_url: '',
    image_url: '',
    extra_image_urls: [] as string[],
    is_active: true,
  });

  useEffect(() => {
    if (!id) return;
    apiClient
      .get(`/listings/${id}`)
      .then((res) => {
        const d = res.data as Record<string, unknown>;
        setForm({
          listing_url: (d.listing_url as string) || '',
          source: (d.source as string) || 'manual',
          address: (d.address as string) || '',
          postcode: (d.postcode as string) || '',
          city: (d.city as string) || '',
          region: (d.region as string) || '',
          price_raw: (d.price_raw as string) || '',
          price_numeric: d.price_numeric != null ? Number(d.price_numeric) : undefined,
          description: (d.description as string) || '',
          agent_name: (d.agent_name as string) || '',
          agent_url: (d.agent_url as string) || '',
          image_url: (d.image_url as string) || '',
          extra_image_urls: Array.isArray(d.extra_image_urls) ? d.extra_image_urls : [],
          is_active: d.is_active !== false,
        });
      })
      .catch(() => toast.error('Listing not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Send all fields explicitly so the backend receives and persists every change (avoid undefined being omitted from JSON).
    const payload = {
      listing_url: form.listing_url.trim() || 'https://example.com/listing',
      source: form.source.trim() || 'manual',
      address: form.address.trim(),
      postcode: form.postcode.trim() || null,
      city: form.city.trim() || null,
      region: form.region.trim() || null,
      price_raw: form.price_raw.trim(),
      price_numeric: form.price_numeric != null ? Number(form.price_numeric) : null,
      description: form.description.trim() || null,
      agent_name: form.agent_name.trim() || null,
      agent_url: form.agent_url.trim() || null,
      image_url: form.image_url.trim() || null,
      extra_image_urls: form.extra_image_urls?.length ? form.extra_image_urls : null,
      is_active: form.is_active,
    };
    apiClient
      .put(`/listings/${id}`, payload)
      .then(() => {
        toast.success('Listing updated');
        router.push('/admin/listings');
      })
      .catch((err) => toast.error(getApiErrorMessage(err.response?.data?.detail, 'Failed to update')))
      .finally(() => setSaving(false));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/listings">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit listing</h1>
          <p className="text-muted-foreground mt-1">Update property details</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listing</CardTitle>
          <CardDescription>Edit fields and save.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div>
                <Label>Postcode</Label>
                <Input value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value })} />
              </div>
              <div>
                <Label>Price (display) *</Label>
                <Input
                  value={form.price_raw}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const parsed = parsePriceFromRaw(raw);
                    setForm((prev) => ({
                      ...prev,
                      price_raw: raw,
                      price_numeric: parsed !== undefined ? parsed : prev.price_numeric,
                    }));
                  }}
                  placeholder="e.g. £128,000 or 128000"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Shown as-is. Numeric is auto-filled from this for sorting/filters.</p>
              </div>
              <div>
                <Label>Price (numeric)</Label>
                <Input
                  type="number"
                  value={form.price_numeric ?? ''}
                  onChange={(e) => setForm({ ...form, price_numeric: e.target.value ? Number(e.target.value) : undefined })}
                />
                <p className="text-xs text-muted-foreground mt-1">Used for sorting, filters and listing cards. Auto-set from display when possible.</p>
              </div>
              <div className="sm:col-span-2">
                <Label>Description</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div>
                <Label>Listing URL</Label>
                <Input value={form.listing_url} onChange={(e) => setForm({ ...form, listing_url: e.target.value })} />
              </div>
              <div>
                <Label>Source</Label>
                <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
              </div>
              <div>
                <Label>Agent name</Label>
                <Input value={form.agent_name} onChange={(e) => setForm({ ...form, agent_name: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <ListingPhotoUpload
                  value={{ imageUrl: form.image_url, extraUrls: form.extra_image_urls ?? [] }}
                  onChange={({ imageUrl, extraUrls }) =>
                    setForm({ ...form, image_url: imageUrl, extra_image_urls: extraUrls })
                  }
                  disabled={saving}
                />
              </div>
              <div>
                <Label>Image URL (or paste link)</Label>
                <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="Or paste an image URL" />
              </div>
              <div className="sm:col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded border"
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/listings">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
