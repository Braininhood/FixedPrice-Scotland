'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ListingCardProps {
  listing: {
    id: string;
    address: string;
    postcode?: string;
    city?: string;
    region?: string;
    price_raw: string;
    price_numeric?: number;
    listing_url: string;
    source?: string;
    image_url?: string | null;
    classifications?: Array<{
      status?: string;
      confidence_score?: number;
      classification_reason?: string;
    }>;
    success_probability?: {
      probability?: string;
      reasoning?: string;
    };
  };
}

export default function ListingCard({ listing }: ListingCardProps) {
  const classification = listing.classifications?.[0];
  const status = classification?.status?.toLowerCase() || '';
  const probability = listing.success_probability?.probability?.toLowerCase() || '';

  const getStatusBadge = () => {
    switch (status) {
      case 'explicit':
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Explicit Fixed Price
          </Badge>
        );
      case 'likely':
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">
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
    const parts = [listing.address];
    if (listing.postcode && !listing.address.includes(listing.postcode)) parts.push(listing.postcode);
    if (listing.city && !listing.address.includes(listing.city)) parts.push(listing.city);
    return parts.join(', ');
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
      {/* Property image or placeholder */}
      <div className="relative w-full aspect-[16/10] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 overflow-hidden">
        {listing.image_url ? (
          <img
            src={listing.image_url}
            alt={listing.address}
            className="object-cover w-full h-full"
            sizes="(max-width: 768px) 100vw, 400px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center p-6">
              <MapPin className="h-12 w-12 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground/50 font-medium">
                {listing.city || 'Property'}
              </p>
            </div>
          </div>
        )}
      </div>
      <CardContent className="p-6 flex-1 flex flex-col">
        {/* Header with badges */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex flex-wrap gap-2">
            {getStatusBadge()}
            {getProbabilityBadge()}
          </div>
          {listing.source && (
            <Badge variant="outline" className="text-xs">
              {listing.source}
            </Badge>
          )}
        </div>

        {/* Price */}
        <div className="mb-3">
          <h3 className="text-2xl font-bold text-primary">
            {formatPrice(listing.price_numeric || listing.price_raw)}
          </h3>
        </div>

        {/* Address */}
        <div className="flex items-start gap-2 mb-4 text-muted-foreground">
          <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
          <p className="text-sm leading-relaxed">{getLocation()}</p>
        </div>

        {/* Classification Reason */}
        {classification?.classification_reason && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <p className="text-xs font-medium text-muted-foreground mb-1">Why this is fixed price:</p>
            <p className="text-sm leading-relaxed">{classification.classification_reason}</p>
          </div>
        )}

        {/* Success Probability Reasoning */}
        {listing.success_probability?.reasoning && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="mb-4 p-2 bg-primary/5 rounded border border-primary/10 cursor-help">
                  <p className="text-xs font-medium text-primary mb-1">
                    {probability === 'high' && '✓ High chance of securing at asking price'}
                    {probability === 'medium' && '⚠ Medium chance of securing at asking price'}
                    {probability === 'low' && '✗ Low chance of securing at asking price'}
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">{listing.success_probability.reasoning}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Confidence Score */}
        {classification?.confidence_score !== undefined && (
          <div className="mt-auto pt-4 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Confidence Score</span>
              <span className="font-medium">
                {Math.round(classification.confidence_score)}%
              </span>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-6 pt-0 flex gap-2">
        <Button asChild className="flex-1" variant="outline">
          <Link href={`/listings/${listing.id}`}>
            View Details
          </Link>
        </Button>
        <Button asChild className="flex-1" variant="default">
          <Link href={listing.listing_url} target="_blank" rel="noopener noreferrer">
            View Original
            <ExternalLink className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
