'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  Filter, 
  Search, 
  X, 
  SlidersHorizontal,
  ArrowUpDown,
  MapPin,
  PoundSterling,
  Sparkles,
  AlertCircle,
  Grid3x3,
  List as ListIcon,
  Map
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api/client';
import ListingCard from '@/components/listings/ListingCard';
import ListingsMap from '@/components/listings/ListingsMap';
import BudgetFilter from '@/components/filters/BudgetFilter';
import AreaFilter from '@/components/filters/AreaFilter';
import ConfidenceFilter from '@/components/filters/ConfidenceFilter';
import FixedPriceToggle from '@/components/filters/FixedPriceToggle';
import FilterBar from '@/components/filters/FilterBar';
import { useDebounce } from '@/hooks/useDebounce';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import ErrorDisplay from '@/components/ui/error-display';
import Link from 'next/link';
import { logger } from '@/lib/logger';

interface Listing {
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
  extra_image_urls?: string[] | null;
  classifications?: Array<{
    status?: string;
    confidence_score?: number;
    classification_reason?: string;
  }>;
  success_probability?: {
    probability?: string;
    reasoning?: string;
  };
}

type SortOption = 'price_asc' | 'price_desc' | 'newest' | 'oldest';

export default function ListingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  // Filter state from URL params (with defaults)
  const [maxBudget, setMaxBudget] = useState<string>(searchParams.get('max_budget') || '');
  const [postcode, setPostcode] = useState<string>(searchParams.get('postcode') || '');
  const [city, setCity] = useState<string>(searchParams.get('city') || '');
  // Fixed Price Only defaults to ON (true) - best practice for this app
  const [fixedPriceOnly, setFixedPriceOnly] = useState<boolean>(
    searchParams.get('fixed_price_only') === null 
      ? true 
      : searchParams.get('fixed_price_only') !== 'false'
  );
  const [confidenceLevel, setConfidenceLevel] = useState<string>(
    searchParams.get('confidence') || 'all'
  );
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get('sort') as SortOption) || 'newest'
  );

  // Debounced values for API calls (prevents excessive requests while typing)
  const debouncedMaxBudget = useDebounce(maxBudget, 500);
  const debouncedPostcode = useDebounce(postcode, 500);
  const debouncedCity = useDebounce(city, 500);
  
  // Data state
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  const itemsPerPage = 12;

  // Check subscription status
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setHasSubscription(false);
        return;
      }
      try {
        const response = await apiClient.get('/subscriptions/me');
        if (response.data && response.data.status === 'active') {
          setHasSubscription(true);
          logger.info('Active subscription detected');
        } else {
          setHasSubscription(false);
        }
      } catch (error: any) {
        // 403 is expected for users without subscription - don't log as error
        if (error?.response?.status === 403 || error?.response?.status === 401) {
          logger.debug('No active subscription (expected)');
        } else {
          logger.warn('Error checking subscription', error);
        }
        setHasSubscription(false);
      }
    };
    checkSubscription();
  }, [user]);

  // Update URL params when filters change (debounced for text inputs)
  const updateURLParams = useCallback(() => {
    const params = new URLSearchParams();
    if (debouncedMaxBudget) params.set('max_budget', debouncedMaxBudget);
    if (debouncedPostcode) params.set('postcode', debouncedPostcode);
    if (debouncedCity) params.set('city', debouncedCity);
    // Only add fixed_price_only to URL if it's OFF (default is ON)
    if (!fixedPriceOnly) params.set('fixed_price_only', 'false');
    if (confidenceLevel && confidenceLevel !== 'all') params.set('confidence', confidenceLevel);
    if (sortBy !== 'newest') params.set('sort', sortBy);
    
    const newUrl = params.toString() ? `/listings?${params.toString()}` : '/listings';
    router.push(newUrl, { scroll: false });
  }, [debouncedMaxBudget, debouncedPostcode, debouncedCity, fixedPriceOnly, confidenceLevel, sortBy, router]);

  // Fetch listings (using debounced values for text inputs)
  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        skip: String((currentPage - 1) * itemsPerPage),
        limit: String(itemsPerPage),
      };
      
      // Use debounced values for text inputs to reduce API calls
      if (debouncedMaxBudget) params.max_price = debouncedMaxBudget;
      if (debouncedPostcode) params.postcode = debouncedPostcode;
      if (debouncedCity) params.city = debouncedCity;
      if (confidenceLevel && confidenceLevel !== 'all' && hasSubscription) {
        params.confidence_level = confidenceLevel;
      }
      
      const response = await apiClient.get('/listings/', { params });
      
      let filteredListings = response.data || [];
      
      // Apply fixed price only filter (client-side for now)
      // Default is ON, so filter out competitive listings
      if (fixedPriceOnly) {
        filteredListings = filteredListings.filter((listing: Listing) => {
          const status = listing.classifications?.[0]?.status?.toLowerCase();
          return status === 'explicit' || status === 'likely';
        });
      }
      
      // Sort listings
      filteredListings = sortListings(filteredListings, sortBy);
      
      setListings(filteredListings);
      setError(null);
      // If we got fewer results than requested, we're on the last page
      const isLastPage = filteredListings.length < itemsPerPage;
      setTotalPages(isLastPage ? currentPage : currentPage + 1);
    } catch (error: any) {
      logger.apiError('Error fetching listings', error, {
        filters: { maxBudget: debouncedMaxBudget, postcode: debouncedPostcode, city: debouncedCity }
      });
      
      // If 401 and we're not using advanced filters, it might be an auth issue - try without token
      if (error.response?.status === 401 && !confidenceLevel) {
        logger.info('Retrying listings fetch without authentication');
        // The interceptor will handle this on next request
        setError(null);
        // Don't show error for 401 on public endpoints
        setListings([]);
      } else if (error.response?.status === 403 && confidenceLevel) {
        const errorMsg = 'Advanced filters require an active subscription.';
        setError(errorMsg);
        toast.error('Subscription Required', {
          description: errorMsg,
        });
        setConfidenceLevel('all');
      } else if (error.response?.status === 401) {
        const errorMsg = 'Please log in to view listings.';
        setError(errorMsg);
        toast.error('Authentication Required', {
          description: errorMsg,
        });
      } else if (error.response?.status >= 500) {
        const errorMsg = 'Server error. Please try again later.';
        setError(errorMsg);
        toast.error('Server Error', {
          description: errorMsg,
        });
      } else {
        const errorMsg = error.response?.data?.detail || error.message || 'Failed to load listings';
        setError(errorMsg);
        toast.error('Error', {
          description: errorMsg,
        });
      }
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedMaxBudget, debouncedPostcode, debouncedCity, fixedPriceOnly, confidenceLevel, sortBy, hasSubscription]);

  // Sort listings
  const sortListings = (listingsToSort: Listing[], sort: SortOption): Listing[] => {
    const sorted = [...listingsToSort];
    switch (sort) {
      case 'price_asc':
        return sorted.sort((a, b) => (a.price_numeric || 0) - (b.price_numeric || 0));
      case 'price_desc':
        return sorted.sort((a, b) => (b.price_numeric || 0) - (a.price_numeric || 0));
      case 'newest':
        return sorted; // Already sorted by backend
      case 'oldest':
        return sorted.reverse();
      default:
        return sorted;
    }
  };

  // Apply filters
  const handleApplyFilters = () => {
    setCurrentPage(1);
    updateURLParams();
    setIsFilterSheetOpen(false);
  };

  // Clear all filters (reset to defaults)
  const handleClearFilters = () => {
    setMaxBudget('');
    setPostcode('');
    setCity('');
    setFixedPriceOnly(true); // Default is ON
    setConfidenceLevel('all');
    setSortBy('newest');
    setCurrentPage(1);
    router.push('/listings', { scroll: false });
  };

  // Effects
  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    updateURLParams();
  }, [updateURLParams]);

  // Prepare active filters for FilterBar component
  const activeFilters = useMemo(() => {
    return [
      debouncedMaxBudget && { 
        key: 'budget', 
        label: 'Max Budget', 
        value: `£${parseInt(debouncedMaxBudget, 10).toLocaleString('en-GB')}`, 
        onRemove: () => setMaxBudget('') 
      },
      debouncedPostcode && { 
        key: 'postcode', 
        label: 'Postcode', 
        value: debouncedPostcode, 
        onRemove: () => setPostcode('') 
      },
      debouncedCity && { 
        key: 'city', 
        label: 'City', 
        value: debouncedCity, 
        onRemove: () => setCity('') 
      },
      confidenceLevel && confidenceLevel !== 'all' && { 
        key: 'confidence', 
        label: 'Confidence', 
        value: confidenceLevel === 'explicit' ? 'Explicit Only' : 'Explicit + Likely', 
        onRemove: () => setConfidenceLevel('all') 
      },
      // Only show "All listings" badge when Fixed Price Only is OFF (default is ON)
      !fixedPriceOnly && { 
        key: 'fixed-price', 
        label: 'Fixed Price', 
        value: 'All listings', 
        onRemove: () => setFixedPriceOnly(true) 
      },
    ].filter((f): f is { key: string; label: string; value: string; onRemove: () => void } => Boolean(f));
  }, [debouncedMaxBudget, debouncedPostcode, debouncedCity, confidenceLevel, fixedPriceOnly]);

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Property Listings</h1>
            <p className="text-muted-foreground">
              Discover fixed price properties across Scotland
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center border rounded-lg p-1">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="gap-2"
              >
                <Grid3x3 className="h-4 w-4" />
                List
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('map')}
                className="gap-2"
              >
                <Map className="h-4 w-4" />
                Map
              </Button>
            </div>

            <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="md:hidden">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {activeFilters.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFilters.length}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>
                    Refine your property search
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  {renderFilters()}
                </div>
              </SheetContent>
            </Sheet>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortBy('newest')}>
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('oldest')}>
                  Oldest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('price_asc')}>
                  Price: Low to High
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('price_desc')}>
                  Price: High to Low
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Active Filters */}
        <FilterBar
          activeFilters={activeFilters}
          onClearAll={handleClearFilters}
          resultCount={listings.length}
        />
      </div>

      {/* Desktop Filters Sidebar */}
      <div className="flex gap-6">
        <aside className="hidden md:block w-64 shrink-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderFilters()}
            </CardContent>
          </Card>
        </aside>

        {/* Listings Grid or Map */}
        <div className="flex-1">
          {isLoading ? (
            <LoadingSpinner size="lg" text="Loading listings..." fullScreen={false} />
          ) : error ? (
            <ErrorDisplay
              title="Failed to load listings"
              message={error}
              onRetry={() => {
                setError(null);
                fetchListings();
              }}
              retryLabel="Retry"
            />
          ) : listings.length > 0 ? (
            <>
              {viewMode === 'list' ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {listings.map((listing) => (
                      <ListingCard key={listing.id} listing={listing} />
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1 || isLoading}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage}
                      {listings.length === itemsPerPage && ' (more available)'}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={listings.length < itemsPerPage || isLoading}
                    >
                      Next
                    </Button>
                  </div>
                </>
              ) : (
                <div className="h-[calc(100vh-300px)] min-h-[600px] mb-8">
                  <ListingsMap listings={listings} isLoading={isLoading} />
                </div>
              )}
            </>
          ) : (
            <EmptyState
              type="no-listings"
              action={{
                label: 'Clear Filters',
                onClick: handleClearFilters,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );

  function renderFilters() {
    return (
      <>
        {/* Budget Filter */}
        <BudgetFilter
          value={maxBudget}
          onChange={setMaxBudget}
          placeholder="e.g., 200000"
        />

        {/* Area Filter */}
        <AreaFilter
          postcode={postcode}
          city={city}
          onPostcodeChange={setPostcode}
          onCityChange={setCity}
        />

        {/* Fixed Price Only Toggle (defaults to ON) */}
        <FixedPriceToggle
          value={fixedPriceOnly}
          onChange={setFixedPriceOnly}
          defaultChecked={true}
        />

        {/* Confidence Level Filter (Subscription-gated) */}
        <ConfidenceFilter
          value={confidenceLevel}
          onChange={setConfidenceLevel}
          hasSubscription={hasSubscription}
        />

        {/* Apply Filters Button (Mobile) */}
        <div className="md:hidden space-y-2">
          <Button onClick={handleApplyFilters} className="w-full">
            Apply Filters
          </Button>
          {activeFilters.length > 0 && (
            <Button variant="outline" onClick={handleClearFilters} className="w-full">
              Clear All
            </Button>
          )}
        </div>
      </>
    );
  }
}
