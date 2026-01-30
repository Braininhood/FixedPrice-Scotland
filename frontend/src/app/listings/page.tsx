'use client';

import React, { Suspense, useState, useEffect, useCallback, useMemo } from 'react';
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

function ListingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  // Filter state from URL params (with defaults). Single "Location" field (like homepage) – town and/or postcode, comma-separated.
  const [location, setLocation] = useState<string>(
    searchParams.get('city') || searchParams.get('postcode') || ''
  );
  const [maxBudget, setMaxBudget] = useState<string>(searchParams.get('max_budget') || '');
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
  const debouncedLocation = useDebounce(location, 500);
  
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

  // Skip one effect run when "Show Properties" is clicked (we call fetchListings with current values directly)
  const skipNextFetchRef = React.useRef(false);

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

  // Build filter values for API/URL: single location sent as city (backend searches both city and postcode)
  const getFilterValues = useCallback((overrides?: { maxBudget?: string; city?: string }) => {
    const loc = overrides?.city ?? debouncedLocation;
    return {
      maxBudget: overrides?.maxBudget ?? debouncedMaxBudget,
      city: loc || undefined,
    };
  }, [debouncedMaxBudget, debouncedLocation]);

  // Update URL params when filters change (uses same filter values as listings request)
  const updateURLParams = useCallback((overrides?: { maxBudget?: string; city?: string }) => {
    const { maxBudget: mb, city: ct } = getFilterValues(overrides);
    const params = new URLSearchParams();
    if (mb) params.set('max_budget', mb);
    if (ct) params.set('city', ct);
    if (!fixedPriceOnly) params.set('fixed_price_only', 'false');
    if (confidenceLevel && confidenceLevel !== 'all') params.set('confidence', confidenceLevel);
    if (sortBy !== 'newest') params.set('sort', sortBy);
    const newUrl = params.toString() ? `/listings?${params.toString()}` : '/listings';
    router.push(newUrl, { scroll: false });
  }, [getFilterValues, fixedPriceOnly, confidenceLevel, sortBy, router]);

  // Fetch listings – filter values come from getFilterValues; pass overrides when "Show Properties" / "Apply" is clicked
  const fetchListings = useCallback(async (overrides?: { maxBudget?: string; city?: string; page?: number }) => {
    setIsLoading(true);
    setError(null);
    try {
      const page = overrides?.page ?? currentPage;
      const { maxBudget: mb, city: ct } = getFilterValues(overrides);
      const params: Record<string, string> = {
        skip: String((page - 1) * itemsPerPage),
        limit: String(itemsPerPage),
      };
      if (mb) params.max_price = mb;
      if (ct) params.city = ct;
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
      const isLastPage = filteredListings.length < itemsPerPage;
      setTotalPages(isLastPage ? page : page + 1);
    } catch (error: any) {
      const { maxBudget: mb, city: ct } = getFilterValues(overrides);
      logger.apiError('Error fetching listings', error, { filters: { maxBudget: mb, city: ct } });
      
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
  }, [currentPage, getFilterValues, fixedPriceOnly, confidenceLevel, sortBy, hasSubscription]);

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

  // Apply filters – read current input values (same source as inputs) and use for request + URL
  const handleApplyFilters = () => {
    const currentValues = { maxBudget, city: location, page: 1 };
    skipNextFetchRef.current = true;
    setCurrentPage(1);
    updateURLParams(currentValues);
    fetchListings(currentValues);
    setIsFilterSheetOpen(false);
  };

  // Clear all filters (reset to defaults)
  const handleClearFilters = () => {
    setMaxBudget('');
    setLocation('');
    setFixedPriceOnly(true); // Default is ON
    setConfidenceLevel('all');
    setSortBy('newest');
    setCurrentPage(1);
    router.push('/listings', { scroll: false });
  };

  // Effects – fetch when filters/page change; skip once when "Show Properties" applied (we call fetchListings with current values)
  useEffect(() => {
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }
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
      debouncedLocation && { 
        key: 'location', 
        label: 'Location', 
        value: debouncedLocation, 
        onRemove: () => setLocation('') 
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
  }, [debouncedMaxBudget, debouncedLocation, confidenceLevel, fixedPriceOnly]);

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
              <Button onClick={handleApplyFilters} className="w-full">
                Show Properties
              </Button>
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

        {/* Location – single field (town and/or postcode, comma-separated), same as homepage */}
        <div className="space-y-2">
          <Label htmlFor="filter-location" className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span>Location</span>
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              id="filter-location"
              placeholder="e.g. Edinburgh, G12, Aberdeen"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10"
              aria-label="Location (town or postcode)"
              autoComplete="off"
            />
          </div>
        </div>

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

export default function ListingsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <ListingsPageContent />
    </Suspense>
  );
}
