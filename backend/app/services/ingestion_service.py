import re
from typing import Optional, Dict, Any, List
from urllib.parse import urlparse
from app.core.database import supabase
from app.models.listing import ListingCreate

class IngestionService:
    # Valid property portal sources
    VALID_SOURCES = ["rightmove", "zoopla", "espc", "s1homes", "agent", "other"]
    
    # URL patterns for known portals
    URL_PATTERNS = {
        "rightmove": r"rightmove\.co\.uk",
        "zoopla": r"zoopla\.co\.uk",
        "espc": r"espc\.com",
        "s1homes": r"s1homes\.com"
    }

    def validate_url(self, url: str) -> tuple[bool, Optional[str]]:
        """
        Validates URL format and identifies source.
        Returns: (is_valid, source_or_error)
        """
        if not url or not isinstance(url, str):
            return False, "URL must be a non-empty string"
        
        # Basic URL validation
        try:
            parsed = urlparse(url)
            if not parsed.scheme or not parsed.netloc:
                return False, "Invalid URL format"
        except Exception:
            return False, "Invalid URL format"
        
        # Check if URL matches known portal patterns
        url_lower = url.lower()
        for source, pattern in self.URL_PATTERNS.items():
            if re.search(pattern, url_lower):
                return True, source
        
        # If no pattern matches, allow it but mark as "other" or "agent"
        return True, "other"

    def validate_listing_data(self, listing_data: Dict[str, Any]) -> tuple[bool, Optional[str]]:
        """
        Validates required fields for a listing.
        Returns: (is_valid, error_message)
        """
        # Required fields
        required_fields = ["listing_url", "source", "address", "price_raw"]
        for field in required_fields:
            if not listing_data.get(field):
                return False, f"Missing required field: {field}"
        
        # Validate URL
        url = listing_data.get("listing_url")
        is_valid_url, url_result = self.validate_url(str(url))
        if not is_valid_url:
            return False, f"Invalid URL: {url_result}"
        
        # Validate source
        source = listing_data.get("source", "").lower()
        if source not in self.VALID_SOURCES:
            return False, f"Invalid source. Must be one of: {', '.join(self.VALID_SOURCES)}"
        
        # Auto-detect source from URL if not provided or mismatched
        detected_source = url_result
        if source != detected_source and detected_source != "other":
            listing_data["source"] = detected_source
        
        # Validate address
        address = listing_data.get("address", "")
        if not address or len(address.strip()) < 5:
            return False, "Address must be at least 5 characters"
        
        # Validate price_raw
        price_raw = listing_data.get("price_raw", "")
        if not price_raw or len(price_raw.strip()) < 1:
            return False, "Price text is required"
        
        return True, None

    def parse_price(self, price_text: str) -> Optional[float]:
        """
        Extracts numeric price from strings like "Fixed Price £250,000" or "Offers Over £180k".
        """
        if not price_text:
            return None
            
        # Remove commas and non-numeric chars except decimal and k/m
        cleaned = price_text.lower().replace(',', '').replace('£', '').strip()
        
        # Look for numbers
        match = re.search(r'(\d+(?:\.\d+)?)', cleaned)
        if not match:
            return None
            
        value = float(match.group(1))
        
        # Handle 'k' or 'm' suffixes
        if 'k' in cleaned:
            value *= 1000
        elif 'm' in cleaned:
            value *= 1000000
            
        return value

    async def check_duplicate(self, url: str) -> tuple[bool, Optional[Dict[str, Any]]]:
        """
        Checks if a listing with this URL already exists.
        Returns: (is_duplicate, existing_listing_or_none)
        """
        response = supabase.table("listings").select("id, listing_url, address, is_active").eq("listing_url", url).execute()
        
        if response.data and isinstance(response.data, list) and len(response.data) > 0:
            return True, response.data[0]
        
        return False, None

    async def add_manual_listing(self, listing_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process and add a single listing manually with comprehensive validation.
        """
        # Validate listing data
        is_valid, error_msg = self.validate_listing_data(listing_data)
        if not is_valid:
            return {"error": error_msg}
        
        url = listing_data.get("listing_url")
        
        # Check for duplicates
        is_duplicate, existing = await self.check_duplicate(str(url))
        if is_duplicate:
            return {
                "error": "Listing already exists",
                "existing_listing": existing
            }

        # Auto-parse numeric price if not provided
        if not listing_data.get("price_numeric") and listing_data.get("price_raw"):
            parsed_price = self.parse_price(str(listing_data["price_raw"]))
            if parsed_price:
                listing_data["price_numeric"] = parsed_price

        # Ensure required fields have defaults
        if "is_active" not in listing_data:
            listing_data["is_active"] = True

        # Insert into database
        try:
            response = supabase.table("listings").insert(listing_data).execute()
            
            if not response.data or not isinstance(response.data, list) or len(response.data) == 0:
                return {"error": "Failed to save listing to database"}
            
            return response.data[0]
        except Exception as e:
            return {"error": f"Database error: {str(e)}"}

ingestion_service = IngestionService()
