from typing import Any, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.core.database import supabase
from app.core.dependencies import check_role
from app.services.classification_service import classification_service
from app.models.classification import ClassificationStatus

router = APIRouter()

@router.post("/manual/{listing_id}")
async def classify_listing_manual(
    listing_id: UUID,
    current_user: dict = Depends(check_role(["admin"]))
) -> Any:
    """
    Manually trigger classification for a specific listing. (Admin only)
    Useful for re-classifying listings or classifying listings that were missed.
    """
    # Get listing
    listing_response = supabase.table("listings").select("*").eq("id", str(listing_id)).single().execute()
    if not listing_response.data or not isinstance(listing_response.data, dict):
        raise HTTPException(status_code=404, detail="Listing not found")
    
    listing = listing_response.data
    description = str(listing.get("description", ""))
    price_text = str(listing.get("price_raw", ""))
    
    if not description and not price_text:
        raise HTTPException(status_code=400, detail="Listing has no description or price to classify")
    
    try:
        # Classify listing
        status_val, confidence, reason = await classification_service.classify_listing(
            description,
            price_text
        )
        
        # Check if classification already exists
        existing = supabase.table("classifications").select("*").eq("listing_id", str(listing_id)).execute()
        
        classification_data = {
            "listing_id": str(listing_id),
            "status": status_val,
            "confidence_score": confidence,
            "classification_reason": reason,
            "ai_model_used": "gpt-4o"
        }
        
        if existing.data and isinstance(existing.data, list) and len(existing.data) > 0:
            # Update existing classification
            supabase.table("classifications").update(classification_data).eq("listing_id", str(listing_id)).execute()
        else:
            # Create new classification
            supabase.table("classifications").insert(classification_data).execute()
        
        return {
            "message": "Listing classified successfully",
            "listing_id": str(listing_id),
            "classification": {
                "status": status_val,
                "confidence_score": confidence,
                "reason": reason
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Classification failed: {str(e)}"
        )

@router.post("/batch")
async def classify_listings_batch(
    listing_ids: Optional[List[UUID]] = None,
    limit: int = Query(10, ge=1, le=50, description="Maximum number of listings to classify"),
    only_unclassified: bool = Query(True, description="Only classify listings without existing classifications"),
    current_user: dict = Depends(check_role(["admin"]))
) -> Any:
    """
    Batch classify multiple listings. (Admin only)
    Processes listings with rate limiting and retry logic.
    """
    try:
        # Get listings to classify
        query = supabase.table("listings").select("id, description, price_raw, is_active").eq("is_active", True)
        
        if listing_ids:
            # Classify specific listings
            ids_str = [str(id) for id in listing_ids]
            query = query.in_("id", ids_str)
        
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
                    if len(listings_to_classify) >= limit:
                        break
        else:
            # Get all active listings (up to limit)
            response = query.limit(limit).execute()
            listings_to_classify = response.data if response.data else []
        
        if not listings_to_classify:
            return {
                "message": "No listings to classify",
                "processed": 0,
                "successful": 0,
                "failed": 0,
                "results": []
            }
        
        # Process classifications with rate limiting
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
            "message": f"Batch classification completed",
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

@router.get("/stats")
async def get_classification_stats(
    current_user: dict = Depends(check_role(["admin"]))
) -> Any:
    """
    Get classification statistics. (Admin only)
    """
    try:
        # Get total listings
        listings_response = supabase.table("listings").select("id", count="exact").eq("is_active", True).execute()
        total_listings = listings_response.count if listings_response.count else 0
        
        # Get classified listings
        classifications_response = supabase.table("classifications").select("status", count="exact").execute()
        total_classified = classifications_response.count if classifications_response.count else 0
        
        # Get breakdown by status
        explicit_response = supabase.table("classifications").select("id", count="exact").eq("status", "explicit").execute()
        likely_response = supabase.table("classifications").select("id", count="exact").eq("status", "likely").execute()
        competitive_response = supabase.table("classifications").select("id", count="exact").eq("status", "competitive").execute()
        
        explicit_count = explicit_response.count if explicit_response.count else 0
        likely_count = likely_response.count if likely_response.count else 0
        competitive_count = competitive_response.count if competitive_response.count else 0
        
        # Get average confidence scores
        all_classifications = supabase.table("classifications").select("confidence_score").execute()
        confidence_scores = []
        if all_classifications.data:
            for cls in all_classifications.data:
                if isinstance(cls, dict):
                    score = cls.get("confidence_score")
                    if score is not None:
                        confidence_scores.append(float(score))
        
        avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
        
        return {
            "total_listings": total_listings,
            "total_classified": total_classified,
            "unclassified": total_listings - total_classified,
            "classification_rate": round((total_classified / total_listings * 100) if total_listings > 0 else 0, 2),
            "breakdown": {
                "explicit": explicit_count,
                "likely": likely_count,
                "competitive": competitive_count
            },
            "average_confidence_score": round(avg_confidence, 2),
            "confidence_distribution": {
                "high_confidence": len([s for s in confidence_scores if s >= 70]),
                "medium_confidence": len([s for s in confidence_scores if 50 <= s < 70]),
                "low_confidence": len([s for s in confidence_scores if s < 50])
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get classification stats: {str(e)}"
        )
