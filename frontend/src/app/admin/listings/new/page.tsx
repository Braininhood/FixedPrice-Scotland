'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiClient, { getApiErrorMessage } from '@/lib/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ListingPhotoUpload } from '@/components/listings/ListingPhotoUpload';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function NewListingPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    listing_url: 'https://example.com/listing',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.address.trim() || !form.price_raw.trim()) {
      toast.error('Address and price are required');
      return;
    }
    // Backend requires valid listing_url and source
    const listingUrl = (form.listing_url || '').trim() || 'https://example.com/listing';
    const source = (form.source || '').trim() || 'manual';
    const urlPattern = /^https?:\/\/[^\s]+$/i;
    if (!urlPattern.test(listingUrl)) {
      toast.error('Listing URL must be a valid http or https URL');
      return;
    }
    const agentUrl = (form.agent_url || '').trim() || undefined;
    if (agentUrl && !urlPattern.test(agentUrl)) {
      toast.error('Agent URL must be a valid http or https URL if provided');
      return;
    }
    const payload = {
      ...form,
      listing_url: listingUrl,
      source,
      agent_url: agentUrl,
      price_numeric: form.price_numeric ?? (parseFloat(form.price_raw.replace(/[^0-9.]/g, '')) || undefined),
      extra_image_urls: form.extra_image_urls?.length ? form.extra_image_urls : undefined,
    };
    setSaving(true);
    apiClient
      .post('/listings/', payload)
      .then(() => {
        toast.success('Listing created');
        router.push('/admin/listings');
      })
      .catch((err) => {
        const message = getApiErrorMessage(err.response?.data?.detail, 'Failed to create listing');
        toast.error(message);
      })
      .finally(() => setSaving(false));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/listings">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add listing</h1>
          <p className="text-muted-foreground mt-1">Create a new property listing</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New listing</CardTitle>
          <CardDescription>Required: address, price. Others optional.</CardDescription>
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
                  placeholder="123 Main St"
                  required
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="postcode">Postcode</Label>
                <Input
                  id="postcode"
                  value={form.postcode}
                  onChange={(e) => setForm({ ...form, postcode: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="price_raw">Price (display) *</Label>
                <Input
                  id="price_raw"
                  value={form.price_raw}
                  onChange={(e) => setForm({ ...form, price_raw: e.target.value })}
                  placeholder="£250,000"
                  required
                />
              </div>
              <div>
                <Label htmlFor="price_numeric">Price (numeric)</Label>
                <Input
                  id="price_numeric"
                  type="number"
                  value={form.price_numeric ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      price_numeric: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="250000"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="listing_url">Listing URL</Label>
                <Input
                  id="listing_url"
                  value={form.listing_url}
                  onChange={(e) => setForm({ ...form, listing_url: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="source">Source</Label>
                <Input
                  id="source"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="agent_name">Agent name</Label>
                <Input
                  id="agent_name"
                  value={form.agent_name}
                  onChange={(e) => setForm({ ...form, agent_name: e.target.value })}
                />
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
                <Label htmlFor="image_url">Image URL (or paste link)</Label>
                <Input
                  id="image_url"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="Or paste an image URL"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create listing'}
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
