from typing import List, Dict, Any
from app.core.database import supabase
from app.services.email_service import EmailService

class AlertService:
    @staticmethod
    async def check_and_send_alerts(listing_id: str):
        """
        Check if a new listing matches any active saved searches and send email alerts.
        Called after a new listing is created.
        """
        # Get the new listing
        listing_response = supabase.table("listings").select("*").eq("id", listing_id).single().execute()
        if not listing_response.data or not isinstance(listing_response.data, dict):
            return
        
        listing = listing_response.data
        
        # Get all active saved searches with user info
        searches_response = supabase.table("user_saved_searches").select("*").eq("is_active", True).execute()
        
        if not searches_response.data or not isinstance(searches_response.data, list):
            return
        
        matches = []
        
        for search in searches_response.data:
            if not isinstance(search, dict):
                continue
            
            # Check if listing matches search criteria
            if AlertService._matches_search(listing, search):
                matches.append(search)
        
        # Send email alerts for matches
        for search in matches:
            try:
                # Get user profile for this search
                user_id = search.get("user_id")
                if user_id:
                    user_response = supabase.table("user_profiles").select("email, full_name").eq("id", str(user_id)).single().execute()
                    
                    if user_response.data and isinstance(user_response.data, dict):
                        email = user_response.data.get("email")
                        full_name = user_response.data.get("full_name", "Valued Member")
                        
                        if email:
                            await EmailService.send_search_alert_email(
                                email=email,
                                full_name=full_name,
                                search_name=search.get("name", "Your saved search"),
                                listing_title=listing.get("title", "New Property"),
                                listing_url=listing.get("url", ""),
                                listing_price=listing.get("price_raw", "Price on request")
                            )
                            
                            # Update last_notified_at
                            supabase.table("user_saved_searches").update({
                                "last_notified_at": "now()"
                            }).eq("id", search.get("id")).execute()
            except Exception as e:
                print(f"Failed to send alert email for search {search.get('id')}: {e}")

    @staticmethod
    def _matches_search(listing: Dict[str, Any], search: Dict[str, Any]) -> bool:
        """
        Check if a listing matches the saved search criteria.
        """
        # Budget check
        if search.get("max_budget"):
            listing_price = listing.get("price_numeric")
            if listing_price and listing_price > float(search.get("max_budget", 0)):
                return False
        
        # Postcode check
        if search.get("postcode"):
            listing_postcode = listing.get("postcode", "")
            if not listing_postcode or search.get("postcode").upper() not in listing_postcode.upper():
                return False
        
        # City check
        if search.get("city"):
            listing_city = listing.get("city", "")
            if not listing_city or search.get("city").lower() not in listing_city.lower():
                return False
        
        # Region check
        if search.get("region"):
            listing_region = listing.get("region", "")
            if not listing_region or search.get("region").lower() not in listing_region.lower():
                return False
        
        # Confidence level check (requires classification)
        if search.get("confidence_level"):
            classification_response = supabase.table("classifications").select("status").eq("listing_id", listing.get("id")).single().execute()
            if classification_response.data and isinstance(classification_response.data, dict):
                classification_status = classification_response.data.get("status", "").lower()
                confidence_level = search.get("confidence_level", "")
                
                if confidence_level == "explicit":
                    if classification_status != "explicit":
                        return False
                elif confidence_level == "explicit_and_likely":
                    if classification_status not in ["explicit", "likely"]:
                        return False
        
        return True

alert_service = AlertService()
