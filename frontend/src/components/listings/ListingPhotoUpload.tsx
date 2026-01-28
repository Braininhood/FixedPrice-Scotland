'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ImagePlus, Loader2, X } from 'lucide-react';
import apiClient from '@/lib/api/client';
import { toast } from 'sonner';

const MAX_FILES = 10;
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ACCEPT = 'image/jpeg,image/png,image/webp';

export interface ListingPhotoValue {
  imageUrl: string;
  extraUrls: string[];
}

interface ListingPhotoUploadProps {
  value: ListingPhotoValue;
  onChange: (value: ListingPhotoValue) => void;
  disabled?: boolean;
  maxTotal?: number;
}

export function ListingPhotoUpload({
  value,
  onChange,
  disabled = false,
  maxTotal = MAX_FILES,
}: ListingPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const allUrls = [value.imageUrl, ...value.extraUrls].filter(Boolean);
  const canAddMore = allUrls.length < maxTotal;

  const removeUrl = (url: string) => {
    if (value.imageUrl === url) {
      const next = value.extraUrls[0] ?? '';
      onChange({ imageUrl: next, extraUrls: value.extraUrls.slice(1) });
    } else {
      onChange({
        imageUrl: value.imageUrl,
        extraUrls: value.extraUrls.filter((u) => u !== url),
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = '';
    if (!files.length || disabled || uploading) return;
    if (allUrls.length + files.length > maxTotal) {
      toast.error(`Maximum ${maxTotal} images allowed. You have ${allUrls.length}, trying to add ${files.length}.`);
      return;
    }
    for (const f of files) {
      const ok = ACCEPT.split(',').some((t) => f.type === t.trim());
      if (!ok) {
        toast.error(`${f.name}: only JPEG, PNG and WebP are allowed.`);
        return;
      }
      if (f.size > MAX_SIZE_BYTES) {
        toast.error(`${f.name}: file must be under 5MB.`);
        return;
      }
    }
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      const res = await apiClient.post<{ urls: string[] }>('/listings/upload-photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newUrls = res.data?.urls ?? [];
      if (newUrls.length === 0) {
        toast.error('No URLs returned from upload');
        setUploading(false);
        return;
      }
      const combined = [...allUrls, ...newUrls].slice(0, maxTotal);
      onChange({
        imageUrl: combined[0] ?? '',
        extraUrls: combined.slice(1),
      });
      toast.success(`${newUrls.length} photo(s) uploaded`);
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : 'Upload failed';
      toast.error(typeof message === 'string' ? message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Photos</Label>
      <p className="text-xs text-muted-foreground">
        JPEG, PNG or WebP, max 5MB each, up to {maxTotal} images. First image is the main photo.
      </p>
      <div className="flex flex-wrap gap-3">
        {allUrls.map((url) => (
          <div
            key={url}
            className="relative h-24 w-24 rounded-lg border bg-muted overflow-hidden group"
          >
            <img
              src={url}
              alt="Listing"
              className="h-full w-full object-cover"
            />
            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-90 group-hover:opacity-100"
                onClick={() => removeUrl(url)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
        {canAddMore && (
          <label className="h-24 w-24 rounded-lg border border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              multiple
              className="sr-only"
              disabled={disabled || uploading}
              onChange={handleFileChange}
            />
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <ImagePlus className="h-8 w-8 text-muted-foreground" />
            )}
            <span className="text-xs text-muted-foreground mt-1">Add</span>
          </label>
        )}
      </div>
    </div>
  );
}
