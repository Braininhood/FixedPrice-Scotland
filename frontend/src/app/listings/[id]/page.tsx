'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  MapPin,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertCircle,
  Info,
  Calendar,
  Building2,
  PoundSterling,
  Sparkles,
  Target,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api/client';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Classification {
  status?: string;
  confidence_score?: number;
  classification_reason?: string;
  ai_model_used?: string;
  created_at?: string;
}

interface SuccessProbability {
  probability?: string;
  reasoning?: string; // May be present in some cases
  reason?: string; // Alternative field name used in error cases
  avg_over_asking?: number;
  friendliness?: string;
}

interface Listing {
  id: string;
  address: string;
  postcode?: string;
  city?: string;
  region?: string;
  price_raw: string;
  price_numeric?: number;
  description?: string;
  listing_url: string;
  source?: string;
  image_url?: string | null;
  extra_image_urls?: string[] | null;
  agent_name?: string;
  agent_url?: string;
  first_seen_at?: string;
  last_checked_at?: string;
  created_at?: string;
  classifications?: Classification[];
  success_probability?: SuccessProbability;
}

export default function ListingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListing = async () => {
      if (!listingId) {
        setError('Invalid listing ID');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await apiClient.get(`/listings/${listingId}`, {
          params: { _t: Date.now() }, // cache-bust so detail shows fresh data after edit
        });
        setListing(response.data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching listing:', err);
        if (err.response?.status === 404) {
          setError('Listing not found');
        } else {
          setError('Failed to load listing details');
          toast.error('Failed to load listing details');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchListing();
  }, [listingId]);

  const classification = listing?.classifications?.[0];
  const status = classification?.status?.toLowerCase() || '';
  const probability = listing?.success_probability?.probability?.toLowerCase() || '';

  const getStatusBadge = () => {
    switch (status) {
      case 'explicit':
        return (
          <Badge className="bg-green-500 hover:bg-green-600 text-white">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Explicit Fixed Price
          </Badge>
        );
      case 'likely':
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
            <Info className="h-3 w-3 mr-1" />
            Likely Fixed Price
          </Badge>
        );
      case 'competitive':
        return (
          <Badge variant="secondary">
            <AlertCircle className="h-3 w-3 mr-1" />
            Competitive
          </Badge>
        );
      default:
        return null;
    }
  };

  const getProbabilityBadge = () => {
    switch (probability) {
      case 'high':
        return (
          <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
            <TrendingUp className="h-3 w-3 mr-1" />
            High Chance
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">
            <Minus className="h-3 w-3 mr-1" />
            Medium Chance
          </Badge>
        );
      case 'low':
        return (
          <Badge variant="outline" className="border-red-500 text-red-700 bg-red-50">
            <TrendingDown className="h-3 w-3 mr-1" />
            Low Chance
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatPrice = (price: string | number | undefined) => {
    if (!price) return 'Price on request';
    if (typeof price === 'number') {
      return `£${price.toLocaleString('en-GB')}`;
    }
    return price;
  };

  const getLocation = () => {
    const parts = [listing?.address];
    if (listing?.postcode && !listing?.address?.includes(listing.postcode)) parts.push(listing.postcode);
    if (listing?.city && !listing?.address?.includes(listing.city)) parts.push(listing.city);
    if (listing?.region && !listing?.address?.includes(listing.region)) parts.push(listing.region);
    return parts.filter(Boolean).join(', ');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-5xl mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Loading listing details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="container max-w-5xl mx-auto py-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/listings')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Listings
        </Button>
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <div>
                <h2 className="text-2xl font-bold mb-2">Listing Not Found</h2>
                <p className="text-muted-foreground mb-4">
                  {error || 'The listing you are looking for does not exist or has been removed.'}
                </p>
                <Button asChild>
                  <Link href="/listings">Browse All Listings</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto py-8">
      {/* Back Navigation */}
      <Button
        variant="ghost"
        onClick={() => router.push('/listings')}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Listings
      </Button>

      <div className="space-y-6">
        {/* Photo gallery: main image + extra images, or placeholder */}
        {(() => {
          const main = listing.image_url;
          const extras = Array.isArray(listing.extra_image_urls) ? listing.extra_image_urls : [];
          const allUrls = main ? [main, ...extras] : extras;
          if (allUrls.length === 0) {
            return (
              <div className="rounded-lg border bg-muted aspect-[16/10] flex items-center justify-center">
                <div className="text-center p-8 text-muted-foreground">
                  <Building2 className="h-16 w-16 mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium">No photos yet</p>
                  <p className="text-xs mt-1">Photos will appear here when added by the listing agent.</p>
                </div>
              </div>
            );
          }
          return (
            <div className="space-y-2">
              <div className="rounded-lg overflow-hidden border bg-muted">
                <img
                  src={allUrls[0]}
                  alt={listing.address}
                  className="w-full max-h-[420px] object-cover"
                  sizes="(max-width: 768px) 100vw, 800px"
                />
              </div>
              {allUrls.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {allUrls.map((url, i) => (
                    <button
                      key={url}
                      type="button"
                      className="flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 border-transparent hover:border-primary focus:border-primary focus:outline-none"
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
        {/* Header Section */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {getStatusBadge()}
                  {getProbabilityBadge()}
                  {listing.source && (
                    <Badge variant="outline" className="text-xs">
                      {listing.source}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-3xl mb-2">
                  {formatPrice(listing.price_numeric || listing.price_raw)}
                </CardTitle>
                <CardDescription className="flex items-start gap-2 text-base">
                  <MapPin className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
                  <span>{getLocation()}</span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full sm:w-auto" size="lg">
              <Link 
                href={listing.listing_url} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                View on {listing.source || 'Original Site'}
                <ExternalLink className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Classification Details */}
        {classification && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Classification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    {getStatusBadge()}
                  </div>
                </div>
                {classification.confidence_score !== undefined && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Confidence Score</p>
                    <p className="text-lg font-semibold">
                      {Math.round(classification.confidence_score)}%
                    </p>
                  </div>
                )}
              </div>
              {classification.classification_reason && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Classification Reason
                  </p>
                  <p className="text-sm leading-relaxed bg-muted p-4 rounded-lg">
                    {classification.classification_reason}
                  </p>
                </div>
              )}
              {classification.ai_model_used && (
                <p className="text-xs text-muted-foreground">
                  Classified using {classification.ai_model_used}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Success Probability */}
        {listing.success_probability && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Success Probability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                {getProbabilityBadge()}
              </div>
              {(listing.success_probability.reasoning || listing.success_probability.reason) && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Analysis
                  </p>
                  <p className="text-sm leading-relaxed bg-primary/5 p-4 rounded-lg border border-primary/10">
                    {listing.success_probability.reasoning || listing.success_probability.reason}
                  </p>
                </div>
              )}
              {listing.success_probability.avg_over_asking !== undefined && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Average Sale Over Asking
                    </p>
                    <p className="text-lg font-semibold">
                      {listing.success_probability.avg_over_asking > 0 ? '+' : ''}
                      {listing.success_probability.avg_over_asking.toFixed(1)}%
                    </p>
                  </div>
                  {listing.success_probability.friendliness && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Area Fixed Price Friendliness
                      </p>
                      <p className="text-lg font-semibold capitalize">
                        {listing.success_probability.friendliness}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Description */}
        {listing.description && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Property Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {listing.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Additional Details */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {listing.agent_name && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Agent</p>
                  <p className="text-sm">{listing.agent_name}</p>
                </div>
              )}
              {listing.agent_url && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Agent Website</p>
                  <Link
                    href={listing.agent_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    Visit Agent Website
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}
              {listing.first_seen_at && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    First Seen
                  </p>
                  <p className="text-sm">{formatDate(listing.first_seen_at)}</p>
                </div>
              )}
              {listing.last_checked_at && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Last Updated
                  </p>
                  <p className="text-sm">{formatDate(listing.last_checked_at)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
