from typing import Dict, Any, Optional
from app.core.database import supabase

class PostcodeService:
    async def get_postcode_stats(self, postcode: str) -> Optional[Dict[str, Any]]:
        """
        Fetch historical stats for a specific postcode.
        """
        # Normalize postcode (e.g., remove spaces and uppercase)
        normalized = postcode.replace(" ", "").upper()
        
        # Try to find stats for the specific postcode, then try the area prefix if not found
        response = supabase.table("postcode_stats").select("*").eq("postcode", normalized).execute()
        
        if response.data and isinstance(response.data, list) and len(response.data) > 0:
            return response.data[0]
            
        # Optional: Try area-level stats (e.g., EH1) if specific postcode stats (EH1 1AA) don't exist
        # This would require more complex mapping logic for the MVP
        return None

    def calculate_success_probability(self, asking_price: float, user_budget: float, avg_over_asking: float) -> str:
        """
        Calculates the probability of securing a home at/near the asking price.
        Logic based on Step 3.9 of Implementation Plan.
        """
        if asking_price > user_budget:
            return "zero" # Budget too low
            
        if avg_over_asking <= 5.0:
            return "high"
        elif avg_over_asking <= 10.0:
            return "medium"
        else:
            return "low"

    async def get_listing_probability(self, listing_id: str, user_budget: Optional[float] = None) -> Dict[str, Any]:
        """
        Get success probability for a specific listing.
        """
        response = supabase.table("listings").select("*").eq("id", listing_id).single().execute()
        if not response.data or not isinstance(response.data, dict):
            return {"error": "Listing not found"}
            
        listing = response.data
        postcode = str(listing.get("postcode", ""))
        asking_price = float(listing.get("price_numeric") or 0)
        
        if not postcode:
            return {"probability": "unknown", "reason": "No postcode provided for listing"}
            
        stats = await self.get_postcode_stats(postcode)
        
        if not stats:
            return {
                "probability": "unknown", 
                "reason": "No historical data for this area yet",
                "avg_over_asking": 0
            }
            
        avg_over_asking = float(stats.get("avg_sale_over_asking") or 0)
        
        prob = self.calculate_success_probability(
            asking_price, 
            user_budget if user_budget else asking_price, # If no budget, assume budget = asking
            avg_over_asking
        )
        
        return {
            "probability": prob,
            "avg_over_asking": avg_over_asking,
            "friendliness": stats.get("fixed_price_friendliness", "unknown")
        }

postcode_service = PostcodeService()
