"""
Zoopla API Integration Service

Handles integration with Zoopla APIs for property listings.
Note: Requires commercial API access from Hometrack.
"""
import os
import asyncio
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import httpx
from app.core.config import settings
from app.services.zoopla_auth import zoopla_auth_service
from app.services.ingestion_service import ingestion_service


class ZooplaService:
    """
    Service for integrating with Zoopla APIs.
    
    This service is prepared for when commercial API access is granted.
    Currently, it will not function until Zoopla credentials are configured.
    """
    
    def __init__(self):
        self.base_url = settings.ZOOPLA_BASE_URL
        self.enabled = zoopla_auth_service.is_enabled()
        self.rate_limit_delay = 2  # seconds between requests
    
    async def fetch_listings(
        self,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Fetch property listings from Zoopla API.
        
        Args:
            filters: Optional filters (postcode, price range, etc.)
            limit: Maximum number of listings to fetch
            
        Returns:
            List of listing dictionaries
            
        Note: This will only work when Zoopla API access is granted.
        """
        if not self.enabled:
            return []
        
        # Get access token
        token = await zoopla_auth_service.get_access_token()
        if not token:
            print("Zoopla API: Failed to get access token")
            return []
        
        try:
            # Construct request
            url = f"{self.base_url}/listing/property-items"
            params = {
                "limit": min(limit, 100),  # API limit
            }
            
            # Add filters if provided
            if filters:
                if "postcode" in filters:
                    params["postcode"] = filters["postcode"]
                if "min_price" in filters:
                    params["minPrice"] = filters["min_price"]
                if "max_price" in filters:
                    params["maxPrice"] = filters["max_price"]
            
            headers = zoopla_auth_service.get_auth_headers(token)
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    url,
                    params=params,
                    headers=headers,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    # Map Zoopla data to our format
                    return self._map_zoopla_listings(data)
                elif response.status_code == 429:
                    # Rate limited - wait and retry
                    print("Zoopla API: Rate limited, waiting before retry...")
                    await asyncio.sleep(self.rate_limit_delay * 2)
                    return await self.fetch_listings(filters, limit)
                else:
                    print(f"Zoopla API error: {response.status_code} - {response.text}")
                    return []
                    
        except Exception as e:
            print(f"Error fetching Zoopla listings: {e}")
            return []
    
    def _map_zoopla_listing(self, zoopla_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Map Zoopla API response to our listing format.
        
        Args:
            zoopla_data: Raw data from Zoopla API
            
        Returns:
            Mapped listing dictionary
        """
        # Construct listing URL
        property_id = zoopla_data.get("propertyId") or zoopla_data.get("id")
        listing_url = f"https://www.zoopla.co.uk/property/{property_id}" if property_id else ""
        
        # Extract price
        price_numeric = zoopla_data.get("price") or zoopla_data.get("priceNumeric")
        price_display = zoopla_data.get("priceDisplay") or zoopla_data.get("price")
        
        # Map to our schema
        return {
            "listing_url": listing_url,
            "source": "zoopla",
            "address": zoopla_data.get("address", {}).get("displayAddress", "") or zoopla_data.get("address", ""),
            "postcode": zoopla_data.get("address", {}).get("postcode", "") or zoopla_data.get("postcode", ""),
            "city": zoopla_data.get("address", {}).get("city", "") or zoopla_data.get("city", ""),
            "region": zoopla_data.get("address", {}).get("county", "") or zoopla_data.get("region", ""),
            "price_raw": str(price_display) if price_display else "",
            "price_numeric": float(price_numeric) if price_numeric else None,
            "description": zoopla_data.get("description", "") or zoopla_data.get("summary", ""),
            "agent_name": zoopla_data.get("agent", {}).get("name", "") or zoopla_data.get("agentName", ""),
            "agent_url": zoopla_data.get("agent", {}).get("url", "") or zoopla_data.get("agentUrl", ""),
            "is_active": True
        }
    
    def _map_zoopla_listings(self, response_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Map Zoopla API response array to our listing format.
        
        Args:
            response_data: Raw response from Zoopla API
            
        Returns:
            List of mapped listing dictionaries
        """
        listings = []
        
        # Handle different response formats
        items = response_data.get("items", []) or response_data.get("data", []) or []
        
        for item in items:
            if isinstance(item, dict):
                mapped = self._map_zoopla_listing(item)
                if mapped.get("listing_url"):  # Only add if we have a URL
                    listings.append(mapped)
        
        return listings
    
    async def sync_listings(
        self,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 100
    ) -> Dict[str, Any]:
        """
        Sync listings from Zoopla API to our database.
        
        Args:
            filters: Optional filters for listings
            limit: Maximum number of listings to sync
            
        Returns:
            Dictionary with sync results
        """
        if not self.enabled:
            return {
                "success": False,
                "message": "Zoopla API is not enabled. Contact Hometrack for commercial access.",
                "processed": 0,
                "added": 0,
                "updated": 0,
                "errors": 0
            }
        
        results = {
            "success": True,
            "processed": 0,
            "added": 0,
            "updated": 0,
            "errors": 0,
            "errors_list": []
        }
        
        try:
            # Fetch listings from Zoopla
            listings = await self.fetch_listings(filters, limit)
            results["processed"] = len(listings)
            
            # Process each listing
            for listing_data in listings:
                try:
                    # Check for duplicates
                    is_duplicate, existing = await ingestion_service.check_duplicate(
                        listing_data["listing_url"]
                    )
                    
                    if is_duplicate:
                        # Update existing listing
                        # (Implementation depends on your update logic)
                        results["updated"] += 1
                    else:
                        # Add new listing
                        result = await ingestion_service.add_manual_listing(listing_data)
                        if "error" not in result:
                            results["added"] += 1
                        else:
                            results["errors"] += 1
                            results["errors_list"].append({
                                "listing": listing_data.get("address", "Unknown"),
                                "error": result.get("error", "Unknown error")
                            })
                            
                except Exception as e:
                    results["errors"] += 1
                    results["errors_list"].append({
                        "listing": listing_data.get("address", "Unknown"),
                        "error": str(e)
                    })
            
            return results
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Sync failed: {str(e)}",
                "processed": results["processed"],
                "added": results["added"],
                "updated": results["updated"],
                "errors": results["errors"]
            }


# Singleton instance
zoopla_service = ZooplaService()
