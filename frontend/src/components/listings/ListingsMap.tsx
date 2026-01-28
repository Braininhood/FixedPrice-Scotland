'use client';

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, MapPin, Loader2 } from 'lucide-react';
import Link from 'next/link';

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ['places'];

interface Listing {
  id: string;
  address: string;
  postcode?: string;
  city?: string;
  price_raw: string;
  price_numeric?: number;
  listing_url: string;
  source?: string;
  classifications?: Array<{
    status?: string;
    confidence_score?: number;
  }>;
  success_probability?: {
    probability?: string;
  };
  // Geocoded coordinates
  lat?: number;
  lng?: number;
}

interface ListingsMapProps {
  listings: Listing[];
  isLoading?: boolean;
}

// Default center: Edinburgh, Scotland
const defaultCenter = {
  lat: 55.9533,
  lng: -3.1883
};

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '500px'
};

export default function ListingsMap({ listings, isLoading }: ListingsMapProps) {
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [geocodedListings, setGeocodedListings] = useState<Listing[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries
  });

  // Show message if API key is missing
  if (!apiKey) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="font-semibold text-lg mb-2">Google Maps API Key Required</h3>
              <p className="text-sm text-muted-foreground mb-4">
                To enable map view, please add your Google Maps API key to the environment variables.
              </p>
              <p className="text-xs text-muted-foreground">
                Add <code className="bg-muted px-1 py-0.5 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your <code className="bg-muted px-1 py-0.5 rounded">.env.local</code> file
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Geocode listings (convert postcodes to coordinates)
  useEffect(() => {
    if (!isLoaded || listings.length === 0) return;

    const geocodeListings = async () => {
      setIsGeocoding(true);
      const geocoder = new google.maps.Geocoder();
      const geocoded: Listing[] = [];

      for (const listing of listings) {
        // Skip if already geocoded
        if (listing.lat && listing.lng) {
          geocoded.push(listing);
          continue;
        }

        // Try to geocode using postcode or address
        const addressToGeocode = listing.postcode || listing.address;
        if (!addressToGeocode) {
          continue;
        }

        try {
          const result = await new Promise<google.maps.GeocoderResult | null>((resolve) => {
            geocoder.geocode(
              { address: `${addressToGeocode}, Scotland, UK` },
              (results, status) => {
                if (status === 'OK' && results && results[0]) {
                  resolve(results[0]);
                } else {
                  resolve(null);
                }
              }
            );
          });

          if (result) {
            const location = result.geometry.location;
            geocoded.push({
              ...listing,
              lat: location.lat(),
              lng: location.lng()
            });
          } else {
            // If geocoding fails, skip this listing
            console.warn(`Failed to geocode: ${addressToGeocode}`);
          }
        } catch (error) {
          console.error(`Error geocoding ${addressToGeocode}:`, error);
        }

        // Rate limiting: small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setGeocodedListings(geocoded);
      setIsGeocoding(false);
    };

    geocodeListings();
  }, [isLoaded, listings]);

  // Calculate map bounds to fit all markers
  const bounds = useMemo(() => {
    if (geocodedListings.length === 0) return null;

    const bounds = new google.maps.LatLngBounds();
    geocodedListings.forEach(listing => {
      if (listing.lat && listing.lng) {
        bounds.extend(new google.maps.LatLng(listing.lat, listing.lng));
      }
    });
    return bounds;
  }, [geocodedListings]);

  // Fit bounds when map loads or listings change
  useEffect(() => {
    if (map && bounds) {
      map.fitBounds(bounds);
      // Add padding
      const padding = { top: 50, right: 50, bottom: 50, left: 50 };
      map.fitBounds(bounds, padding);
    }
  }, [map, bounds]);

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const onMapUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const getMarkerColor = (listing: Listing) => {
    const status = listing.classifications?.[0]?.status?.toLowerCase();
    if (status === 'explicit') return '#22c55e'; // green
    if (status === 'likely') return '#3b82f6'; // blue
    return '#6b7280'; // gray
  };

  const formatPrice = (price: string | number | undefined) => {
    if (!price) return 'Price on request';
    if (typeof price === 'number') {
      return `£${price.toLocaleString('en-GB')}`;
    }
    return price;
  };

  if (loadError) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <p className="text-destructive">Error loading map</p>
            <p className="text-sm text-muted-foreground">
              Please check your Google Maps API key configuration.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-lg overflow-hidden border">
      {isGeocoding && (
        <div className="absolute top-4 left-4 z-10 bg-background/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Geocoding locations...</span>
        </div>
      )}

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={10}
        onLoad={onMapLoad}
        onUnmount={onMapUnmount}
        options={{
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        }}
      >
        {geocodedListings.map((listing) => {
          if (!listing.lat || !listing.lng) return null;

          return (
            <Marker
              key={listing.id}
              position={{ lat: listing.lat, lng: listing.lng }}
              onClick={() => setSelectedListing(listing)}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: getMarkerColor(listing),
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              }}
            />
          );
        })}

        {selectedListing && selectedListing.lat && selectedListing.lng && (
          <InfoWindow
            position={{ lat: selectedListing.lat, lng: selectedListing.lng }}
            onCloseClick={() => setSelectedListing(null)}
          >
            <div className="p-2 min-w-[250px] max-w-[300px]">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-lg">
                    {formatPrice(selectedListing.price_numeric || selectedListing.price_raw)}
                  </h3>
                  {selectedListing.classifications?.[0]?.status && (
                    <Badge
                      className={
                        selectedListing.classifications[0].status.toLowerCase() === 'explicit'
                          ? 'bg-green-500'
                          : selectedListing.classifications[0].status.toLowerCase() === 'likely'
                          ? 'bg-blue-500'
                          : 'bg-gray-500'
                      }
                    >
                      {selectedListing.classifications[0].status}
                    </Badge>
                  )}
                </div>

                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>{selectedListing.address}</p>
                </div>

                {selectedListing.postcode && (
                  <p className="text-xs text-muted-foreground">{selectedListing.postcode}</p>
                )}

                {selectedListing.success_probability?.probability && (
                  <Badge variant="outline" className="text-xs">
                    {selectedListing.success_probability.probability} chance
                  </Badge>
                )}

                <Button
                  asChild
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => setSelectedListing(null)}
                >
                  <Link
                    href={selectedListing.listing_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Details
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
