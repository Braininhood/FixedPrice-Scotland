import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile, status
from pydantic import ValidationError
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.database import supabase
from app.core.dependencies import get_current_user, check_role, get_optional_user, get_current_user_with_role
from app.core.logging_config import get_logger
from app.models.listing import Listing, ListingCreate, ListingUpdate
from app.models.classification import Classification, ClassificationStatus
from app.models.filters import ListingFilters
from app.services.classification_service import classification_service
from app.services.postcode_service import postcode_service
from app.services.email_service import EmailService
from app.services.alert_service import alert_service

logger = get_logger(__name__)
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


async def get_listings(
    request: Request,
    skip: int = Query(0, ge=0, le=10000),
    limit: int = Query(100, ge=1, le=100),
    postcode: Optional[str] = Query(None, max_length=10),
    city: Optional[str] = Query(None, max_length=100),
    max_price: Optional[float] = Query(None, ge=0, le=10000000),
    user_budget: Optional[float] = Query(None, ge=0, le=10000000),
    confidence_level: Optional[str] = Query(None, description="Filter by confidence: 'explicit' or 'explicit_and_likely' (subscription required)"),
) -> Any:
    """
    Retrieve all active listings with optional filters.
    Includes success probability calculation.
    Advanced filters (confidence_level) require active subscription.
    """
    # Validate inputs using Pydantic model
    try:
        filters = ListingFilters(
            skip=skip,
            limit=limit,
            postcode=postcode,
            city=city,
            max_price=max_price,
            user_budget=user_budget,
            confidence_level=confidence_level
        )
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=e.errors())
    
    current_user = await get_optional_user(request)
    # Check if advanced filter is requested
    if filters.confidence_level:
        # Verify subscription for advanced filters
        if not current_user:
            raise HTTPException(
                status_code=403,
                detail="Authentication required to use confidence level filters"
            )
        
        try:
            subscription = supabase.table("subscriptions").select("status").eq("user_id", current_user.get("id")).eq("status", "active").execute()
            if not subscription.data or not isinstance(subscription.data, list) or len(subscription.data) == 0:
                raise HTTPException(
                    status_code=403,
                    detail="Active subscription required to use confidence level filters"
                )
        except HTTPException:
            # Re-raise HTTP exceptions
            raise
        except Exception as e:
            # Log database errors but allow the request to continue without the filter
            logger.error(f"Error checking subscription: {e}")
            raise HTTPException(
                status_code=500,
                detail="Error verifying subscription status"
            )
    
    query = supabase.table("listings").select("*, classifications(*)").eq("is_active", True)
    
    # Use validated and sanitized filters
    if filters.postcode:
        query = query.ilike("postcode", f"%{filters.postcode}%")
    if filters.city:
        query = query.ilike("city", f"%{filters.city}%")
    if filters.max_price:
        query = query.lte("price_numeric", filters.max_price)
        
    response = query.range(filters.skip, filters.skip + filters.limit - 1).execute()
    
    # Enrich listings with probability data
    results = []
    if response.data and isinstance(response.data, list):
        for item in response.data:
            if not isinstance(item, dict):
                continue
                
            listing_id = item.get("id")
            if not listing_id:
                continue
            
            # Apply confidence level filter if specified (subscription-gated)
            if filters.confidence_level:
                classification = item.get("classifications")
                if classification and isinstance(classification, list) and len(classification) > 0:
                    class_data = classification[0] if isinstance(classification[0], dict) else None
                    if class_data:
                        status_value = class_data.get("status")
                        class_status = str(status_value).lower() if status_value is not None else ""
                        if filters.confidence_level == "explicit" and class_status != "explicit":
                            continue
                        elif filters.confidence_level == "explicit_and_likely" and class_status not in ["explicit", "likely"]:
                            continue
                else:
                    continue  # Skip if no classification
                
            prob_data = await postcode_service.get_listing_probability(str(listing_id), filters.user_budget)
            item["success_probability"] = prob_data
            results.append(item)
        
    return results


# List route (no auth) - must be declared before /{listing_id} so exact path matches first
@router.get("", response_model=list)
@router.get("/", response_model=list)
@limiter.limit("60/minute")  # Rate limit: 60 requests per minute for public endpoint
async def list_listings(
    request: Request,
    skip: int = Query(0, ge=0, le=10000),
    limit: int = Query(100, ge=1, le=100),
    postcode: Optional[str] = Query(None, max_length=10),
    city: Optional[str] = Query(None, max_length=100),
    max_price: Optional[float] = Query(None, ge=0, le=10000000),
    user_budget: Optional[float] = Query(None, ge=0, le=10000000),
    confidence_level: Optional[str] = Query(None, description="Filter by confidence"),
) -> Any:
    """Public list of listings - no authentication required."""
    logger.info(f"Public listings endpoint called - skip={skip}, limit={limit}")
    return await get_listings(
        request, skip=skip, limit=limit, postcode=postcode, city=city,
        max_price=max_price, user_budget=user_budget, confidence_level=confidence_level,
    )


@router.get("/admin/all")
@limiter.limit("120/minute")
async def list_all_listings_admin(
    request: Request,
    skip: int = Query(0, ge=0, le=10000),
    limit: int = Query(50, ge=1, le=100),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    city: Optional[str] = Query(None, max_length=100),
    postcode: Optional[str] = Query(None, max_length=10),
    current_user: dict = Depends(get_current_user_with_role(["admin", "agent"])),
) -> Any:
    """
    List listings for admin (all) or agent (only their own). Same response shape.
    """
    query = supabase.table("listings").select("*, classifications(id, status, confidence_score)").order("created_at", desc=True)
    if current_user.get("role") == "agent":
        query = query.eq("created_by_user_id", str(current_user.get("id")))
    if is_active is not None:
        query = query.eq("is_active", is_active)
    if city:
        query = query.ilike("city", f"%{city}%")
    if postcode:
        query = query.ilike("postcode", f"%{postcode}%")
    response = query.range(skip, skip + limit - 1).execute()
    data = response.data if response.data and isinstance(response.data, list) else []
    count_query = supabase.table("listings").select("*", count="exact", head=True)  # type: ignore[arg-type]
    if current_user.get("role") == "agent":
        count_query = count_query.eq("created_by_user_id", str(current_user.get("id")))
    if is_active is not None:
        count_query = count_query.eq("is_active", is_active)
    if city:
        count_query = count_query.ilike("city", f"%{city}%")
    if postcode:
        count_query = count_query.ilike("postcode", f"%{postcode}%")
    count_resp = count_query.execute()
    total = getattr(count_resp, "count", None) or len(data)
    return {"listings": data, "total": total}


# Allowed image types and limits for photo upload
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5MB
MAX_FILES = 10
LISTING_PHOTOS_BUCKET = "listing-photos"


@router.post("/upload-photos")
@limiter.limit("30/minute")
async def upload_listing_photos(
    request: Request,
    files: List[UploadFile] = File(..., description="Image files (JPEG, PNG, WebP), max 5MB each, max 10 files"),
    current_user: dict = Depends(check_role(["admin", "agent"])),
) -> Any:
    """
    Upload listing photos. Returns public URLs. Admin or Agent only.
    Validation: JPEG/PNG/WebP, max 5MB per file, max 10 files.
    """
    if len(files) > MAX_FILES:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {MAX_FILES} files allowed per upload",
        )
    urls: List[str] = []
    try:
        # Ensure bucket exists (create if missing)
        try:
            buckets_resp = supabase.storage.list_buckets()
            buckets = getattr(buckets_resp, "data", None) or buckets_resp or []
            bucket_ids = [b.get("id") if isinstance(b, dict) else getattr(b, "id", None) for b in buckets]
            if LISTING_PHOTOS_BUCKET not in bucket_ids:
                supabase.storage.create_bucket(
                    LISTING_PHOTOS_BUCKET,
                    options={
                        "public": True,
                        "allowed_mime_types": ["image/jpeg", "image/png", "image/webp"],
                        "file_size_limit": MAX_FILE_SIZE_BYTES,
                    },
                )
                logger.info("Created storage bucket: %s", LISTING_PHOTOS_BUCKET)
        except Exception as bucket_err:
            logger.warning("Bucket check/create skipped: %s", bucket_err)

        for f in files:
            if not f.filename:
                continue
            content_type = f.content_type or ""
            if content_type not in ALLOWED_IMAGE_TYPES:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid file type: {f.filename}. Allowed: JPEG, PNG, WebP",
                )
            body = await f.read()
            if len(body) > MAX_FILE_SIZE_BYTES:
                raise HTTPException(
                    status_code=400,
                    detail=f"File too large: {f.filename}. Max size is 5MB",
                )
            ext = "jpg" if "jpeg" in content_type else "png" if "png" in content_type else "webp"
            path = f"{uuid.uuid4()}.{ext}"
            supabase.storage.from_(LISTING_PHOTOS_BUCKET).upload(
                path,
                body,
                file_options={"content-type": content_type, "upsert": "true"},
            )
            public_url = supabase.storage.from_(LISTING_PHOTOS_BUCKET).get_public_url(path)
            urls.append(public_url)
        return {"urls": urls}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Listing photo upload failed: %s", e)
        raise HTTPException(status_code=500, detail="Upload failed. Ensure the listing-photos bucket exists and is public.")


@router.get("/{listing_id}")
@limiter.limit("120/minute")  # Rate limit: 120 requests per minute
async def get_listing(
    request: Request,
    listing_id: UUID,
    user_budget: Optional[float] = Query(None, ge=0, le=10000000),
) -> Any:
    """
    Get a single listing by ID with full details including classification and success probability.
    """
    await get_optional_user(request)  # optional: could be used for personalization
    # Get listing with classifications
    response = supabase.table("listings").select("*, classifications(*)").eq("id", str(listing_id)).single().execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    listing = response.data
    if not isinstance(listing, dict):
        raise HTTPException(status_code=500, detail="Unexpected response format from database")
    
    # Get success probability
    prob_data = await postcode_service.get_listing_probability(str(listing_id), user_budget)
    listing["success_probability"] = prob_data
    
    return listing

@router.post("/", response_model=Listing, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")  # Rate limit: 10 listing creations per minute
async def create_listing(
    request: Request,
    listing_in: ListingCreate,
    current_user: dict = Depends(check_role(["admin", "agent"]))
) -> Any:
    """
    Create a new listing. (Admin or Agent only)
    Automatically triggers AI classification and sends confirmation email.
    Agents' listings are tracked via created_by_user_id so they can only edit/delete their own.
    Unverified agents (without active Verified Agent subscription) can only create 1 listing per week.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found")
    
    # Check if user is an agent (not admin)
    user_profile_response = supabase.table("user_profiles").select("role").eq("id", str(user_id)).single().execute()
    user_role = None
    if user_profile_response.data and isinstance(user_profile_response.data, dict):
        user_role = user_profile_response.data.get("role")
    
    # If agent (not admin), check subscription and weekly limit
    if user_role == "agent":
        # Check for active Verified Agent subscription
        subscription_response = (
            supabase.table("subscriptions")
            .select("*")
            .eq("user_id", str(user_id))
            .eq("plan_type", "agent_verification")
            .eq("status", "active")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        
        is_verified_agent = (
            subscription_response.data 
            and isinstance(subscription_response.data, list) 
            and len(subscription_response.data) > 0
        )
        
        if not is_verified_agent:
            # Unverified agent - check weekly limit (1 listing per week)
            week_ago = datetime.now(timezone.utc) - timedelta(days=7)
            
            listings_response = (
                supabase.table("listings")
                .select("id")
                .eq("created_by_user_id", str(user_id))
                .gte("created_at", week_ago.isoformat())
                .execute()
            )
            
            # Count listings from the last week
            weekly_count = 0
            if listings_response.data and isinstance(listings_response.data, list):
                weekly_count = len(listings_response.data)
            
            if weekly_count >= 1:
                raise HTTPException(
                    status_code=403,
                    detail="Unverified agents can only create 1 listing per week. Please upgrade to Verified Agent subscription for unlimited listings."
                )
    
    listing_data = listing_in.model_dump()
    listing_data["created_by_user_id"] = str(user_id)
    response = supabase.table("listings").insert(listing_data).execute()
    
    if not response.data:
        raise HTTPException(status_code=400, detail="Error creating listing")
    
    new_listing = response.data[0]
    if not isinstance(new_listing, dict):
        raise HTTPException(status_code=500, detail="Unexpected response format from database")
    
    # Trigger classification
    status_val, confidence, reason = await classification_service.classify_listing(
        str(new_listing.get("description", "")),
        str(new_listing.get("price_raw", ""))
    )
    
    # Save classification
    supabase.table("classifications").insert({
        "listing_id": str(new_listing.get("id")),
        "status": status_val,
        "confidence_score": confidence,
        "classification_reason": reason,
        "ai_model_used": "gpt-4o"
    }).execute()

    # Send confirmation email
    if user_id:
        user_response = supabase.table("user_profiles").select("email").eq("id", str(user_id)).single().execute()
        if user_response.data and isinstance(user_response.data, dict):
            email_value = user_response.data.get("email")
            if email_value and isinstance(email_value, str) and len(email_value) > 0:
                email_str: str = email_value  # Type assertion for linter
                try:
                    await EmailService.send_listing_confirmation(
                        email=email_str,
                        listing_title=str(new_listing.get("title", "New Property"))
                    )
                except Exception as e:
                    logger.error(f"Failed to send listing confirmation email: {e}")
    
    # Check for saved search matches and send alerts
    try:
        await alert_service.check_and_send_alerts(str(new_listing.get("id")))
    except Exception as e:
        logger.error(f"Failed to check and send search alerts: {e}")
    
    return new_listing

def _listing_owner_id(listing: Any) -> Optional[str]:
    if not isinstance(listing, dict):
        return None
    uid = listing.get("created_by_user_id")
    return str(uid) if uid is not None else None


@router.put("/{listing_id}", response_model=Listing)
@limiter.limit("20/minute")  # Rate limit: 20 updates per minute
async def update_listing(
    request: Request,
    listing_id: UUID,
    listing_in: ListingUpdate,
    current_user: dict = Depends(get_current_user_with_role(["admin", "agent"])),
) -> Any:
    """
    Update an existing listing. Admin can update any; agent only their own (created_by_user_id).
    """
    existing = supabase.table("listings").select("id, created_by_user_id").eq("id", str(listing_id)).execute()
    if not existing.data or not isinstance(existing.data, list) or len(existing.data) == 0:
        raise HTTPException(status_code=404, detail="Listing not found")
    row = existing.data[0]
    if current_user.get("role") == "agent":
        owner_id = _listing_owner_id(row)
        if owner_id != str(current_user.get("id")):
            raise HTTPException(status_code=403, detail="You can only edit your own listings.")
    # Build update from validated model; ensure price fields are always included when present
    # so they are never dropped by exclude_unset or serializer (fixes price not updating in UI).
    update_data = listing_in.model_dump(exclude_unset=True)
    if "price_raw" in listing_in.model_fields_set:
        update_data["price_raw"] = listing_in.price_raw if listing_in.price_raw is not None else ""
    if "price_numeric" in listing_in.model_fields_set:
        update_data["price_numeric"] = listing_in.price_numeric
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    response = supabase.table("listings").update(update_data).eq("id", str(listing_id)).execute()
    if not response.data or not isinstance(response.data, list):
        raise HTTPException(status_code=404, detail="Listing not found")
    return response.data[0]


@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("30/minute")
async def delete_listing(
    request: Request,
    listing_id: UUID,
    current_user: dict = Depends(get_current_user_with_role(["admin", "agent"])),
) -> None:
    """
    Delete a listing. Admin can delete any; agent only their own (created_by_user_id).
    """
    existing = supabase.table("listings").select("id, created_by_user_id").eq("id", str(listing_id)).execute()
    if not existing.data or not isinstance(existing.data, list) or len(existing.data) == 0:
        raise HTTPException(status_code=404, detail="Listing not found")
    row = existing.data[0]
    if current_user.get("role") == "agent":
        owner_id = _listing_owner_id(row)
        if owner_id != str(current_user.get("id")):
            raise HTTPException(status_code=403, detail="You can only delete your own listings.")
    response = supabase.table("listings").delete().eq("id", str(listing_id)).execute()
    if response.data is not None and isinstance(response.data, list) and len(response.data) == 0:
        raise HTTPException(status_code=404, detail="Listing not found")
