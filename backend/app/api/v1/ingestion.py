from typing import Any, Optional, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.dependencies import check_role
from app.services.ingestion_service import ingestion_service
from app.services.classification_service import classification_service
from app.core.database import supabase
from app.models.ingestion import ManualListingInput, PostcodeStatsInput

router = APIRouter()

@router.post("/manual")
async def ingest_manual_listing(
    listing_data: ManualListingInput,
    current_user: dict = Depends(check_role(["admin", "agent"]))
) -> Any:
    """
    Manually ingest a listing from a URL and listing details.
    
    **Features:**
    - Validates all required fields
    - Checks for duplicate listings by URL
    - Auto-parses numeric price from price_raw if not provided
    - Auto-detects source from URL if possible
    - Triggers automatic AI classification immediately
    - Returns listing and classification results
    
    **Required fields:**
    - listing_url: URL of the property listing
    - source: rightmove, zoopla, espc, s1homes, onthemarket, agent, or other
    - address: Full address (minimum 5 characters)
    - price_raw: Raw price text (e.g., "Fixed Price £250,000")
    
    **Optional fields:**
    - postcode, city, region, description, agent_name, agent_url
    - price_numeric: Will be auto-parsed from price_raw if not provided
    """
    # Convert Pydantic model to dict
    listing_dict = listing_data.model_dump()
    
    # 1. Basic Ingestion with validation
    result = await ingestion_service.add_manual_listing(listing_dict)
    
    if "error" in result:
        # Check if it's a duplicate with existing listing info
        if "existing_listing" in result:
            raise HTTPException(
                status_code=409,
                detail={
                    "error": result["error"],
                    "existing_listing": result["existing_listing"]
                }
            )
        raise HTTPException(status_code=400, detail=result["error"])
        
    listing_id = result.get("id")
    if not listing_id:
        raise HTTPException(status_code=500, detail="Failed to create listing")
    
    # 2. Trigger AI Classification
    try:
        status_val, confidence, reason = await classification_service.classify_listing(
            str(result.get("description", "")),
            str(result.get("price_raw", ""))
        )
        
        # 3. Save Classification
        supabase.table("classifications").insert({
            "listing_id": str(listing_id),
            "status": status_val,
            "confidence_score": confidence,
            "classification_reason": reason,
            "ai_model_used": "gpt-4o"
        }).execute()
        
        classification_result = {
            "status": status_val,
            "confidence": confidence,
            "reason": reason
        }
    except Exception as e:
        # Classification failed, but listing was created
        classification_result = {
            "status": "failed",
            "error": str(e)
        }
    
    return {
        "message": "Listing ingested successfully",
        "listing": result,
        "classification": classification_result
    }

@router.get("/stats")
async def get_ingestion_stats(
    current_user: dict = Depends(check_role(["admin"]))
) -> Any:
    """
    Get comprehensive stats about ingested listings.
    """
    # Total listings
    listings_count = supabase.table("listings").select("id", count="exact").execute()  # type: ignore
    total_listings = listings_count.count if listings_count.count is not None else 0
    
    # Active listings
    active_listings = supabase.table("listings").select("id", count="exact").eq("is_active", True).execute()  # type: ignore
    active_count = active_listings.count if active_listings.count is not None else 0
    
    # Classified listings
    class_count = supabase.table("classifications").select("id", count="exact").execute()  # type: ignore
    total_classified = class_count.count if class_count.count is not None else 0
    
    # Listings by source
    sources_response = supabase.table("listings").select("source").execute()
    source_counts = {}
    if sources_response.data:
        for listing in sources_response.data:
            if isinstance(listing, dict):
                source = listing.get("source", "unknown")
                source_counts[source] = source_counts.get(source, 0) + 1
    
    return {
        "total_listings": total_listings,
        "active_listings": active_count,
        "inactive_listings": total_listings - active_count,
        "total_classified": total_classified,
        "unclassified": total_listings - total_classified,
        "classification_rate": round((total_classified / total_listings * 100) if total_listings > 0 else 0, 2),
        "listings_by_source": source_counts
    }

@router.post("/postcode-stats")
async def add_postcode_stats(
    stats_data: PostcodeStatsInput,
    current_user: dict = Depends(check_role(["admin"]))
) -> Any:
    """
    Manually add or update postcode statistics.
    
    **Fields:**
    - postcode: Postcode (e.g., 'EH1 1AA' or 'EH1') - will be normalized
    - avg_sale_over_asking: Average sale price over asking price as percentage (0-100)
    - total_sales: Total number of sales in this postcode (default: 0)
    - fixed_price_friendliness: 'high', 'medium', or 'low'
    
    **Usage:**
    - For MVP, manually add postcode stats based on historical data
    - Used to calculate success probability for listings
    - If postcode already exists, it will be updated
    """
    try:
        # Check if postcode stats already exist
        existing = supabase.table("postcode_stats").select("*").eq("postcode", stats_data.postcode).execute()
        
        stats_dict = stats_data.model_dump()
        
        if existing.data and isinstance(existing.data, list) and len(existing.data) > 0:
            # Update existing stats
            response = supabase.table("postcode_stats").update(stats_dict).eq("postcode", stats_data.postcode).execute()
            if response.data and isinstance(response.data, list) and len(response.data) > 0:
                return {
                    "message": "Postcode stats updated successfully",
                    "stats": response.data[0]
                }
        else:
            # Insert new stats
            response = supabase.table("postcode_stats").insert(stats_dict).execute()
            if response.data and isinstance(response.data, list) and len(response.data) > 0:
                return {
                    "message": "Postcode stats added successfully",
                    "stats": response.data[0]
                }
        
        raise HTTPException(status_code=500, detail="Failed to save postcode stats")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving postcode stats: {str(e)}")

@router.get("/postcode-stats/{postcode}")
async def get_postcode_stats(
    postcode: str,
    current_user: dict = Depends(check_role(["admin"]))
) -> Any:
    """
    Get postcode statistics for a specific postcode.
    """
    # Normalize postcode
    normalized = postcode.replace(" ", "").upper()
    
    response = supabase.table("postcode_stats").select("*").eq("postcode", normalized).execute()
    
    if response.data and isinstance(response.data, list) and len(response.data) > 0:
        return response.data[0]
    
    raise HTTPException(status_code=404, detail=f"Postcode stats not found for: {postcode}")

@router.get("/postcode-stats")
async def list_postcode_stats(
    current_user: dict = Depends(check_role(["admin"]))
) -> Any:
    """
    List all postcode statistics.
    """
    response = supabase.table("postcode_stats").select("*").order("postcode").execute()
    
    return {
        "total": len(response.data) if response.data else 0,
        "stats": response.data if response.data else []
    }

@router.post("/batch-classify")
async def batch_classify_listings(
    only_unclassified: bool = True,
    limit: int = 50,
    current_user: dict = Depends(check_role(["admin"]))
) -> Any:
    """
    Helper endpoint for initial data population.
    Batch classifies existing listings that don't have classifications yet.
    
    **Usage for Step 6.3: Initial Data Population**
    1. Manually enter 20-50 sample listings via `/ingestion/manual`
    2. Call this endpoint to classify all unclassified listings
    3. Verify classification results
    4. Fix any data quality issues
    
    **Parameters:**
    - only_unclassified: Only classify listings without existing classifications (default: True)
    - limit: Maximum number of listings to classify (default: 50, max: 50)
    
    **Note**: This endpoint uses the same logic as `/classifications/batch` but is
    specifically designed for the initial data population workflow.
    """
    # Use the same implementation pattern as /classifications/batch
    try:
        # Get listings to classify
        query = supabase.table("listings").select("id, description, price_raw, is_active").eq("is_active", True)
        
        if only_unclassified:
            # Get listings without classifications
            all_listings = query.execute()
            if not all_listings.data:
                return {
                    "message": "No listings found",
                    "processed": 0,
                    "successful": 0,
                    "failed": 0,
                    "results": []
                }
            
            # Filter out listings that already have classifications
            listings_to_classify = []
            for listing in all_listings.data:
                if not isinstance(listing, dict):
                    continue
                listing_id = listing.get("id")
                if not listing_id:
                    continue
                
                existing = supabase.table("classifications").select("id").eq("listing_id", str(listing_id)).execute()
                if not existing.data or len(existing.data) == 0:
                    listings_to_classify.append(listing)
                    if len(listings_to_classify) >= min(limit, 50):
                        break
        else:
            # Get all active listings (up to limit)
            response = query.limit(min(limit, 50)).execute()
            listings_to_classify = response.data if response.data else []
        
        if not listings_to_classify:
            return {
                "message": "No listings to classify",
                "processed": 0,
                "successful": 0,
                "failed": 0,
                "results": []
            }
        
        # Process classifications
        results = []
        successful = 0
        failed = 0
        
        for listing in listings_to_classify:
            if not isinstance(listing, dict):
                continue
            
            listing_id = listing.get("id")
            description = str(listing.get("description", ""))
            price_text = str(listing.get("price_raw", ""))
            
            if not listing_id:
                continue
            
            try:
                # Classify with retry logic (handled in service)
                status_val, confidence, reason = await classification_service.classify_listing(
                    description,
                    price_text
                )
                
                # Save classification
                classification_data = {
                    "listing_id": str(listing_id),
                    "status": status_val,
                    "confidence_score": confidence,
                    "classification_reason": reason,
                    "ai_model_used": "gpt-4o"
                }
                
                # Check if exists and update or insert
                existing = supabase.table("classifications").select("id").eq("listing_id", str(listing_id)).execute()
                if existing.data and len(existing.data) > 0:
                    supabase.table("classifications").update(classification_data).eq("listing_id", str(listing_id)).execute()
                else:
                    supabase.table("classifications").insert(classification_data).execute()
                
                results.append({
                    "listing_id": str(listing_id),
                    "status": "success",
                    "classification": {
                        "status": status_val,
                        "confidence_score": confidence
                    }
                })
                successful += 1
                
            except Exception as e:
                results.append({
                    "listing_id": str(listing_id),
                    "status": "failed",
                    "error": str(e)
                })
                failed += 1
        
        return {
            "message": f"Batch classification completed for initial data population",
            "processed": len(listings_to_classify),
            "successful": successful,
            "failed": failed,
            "results": results
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Batch classification failed: {str(e)}"
        )
