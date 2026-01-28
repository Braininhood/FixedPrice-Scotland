"""
Zoopla API Integration Endpoints

Endpoints for syncing listings from Zoopla API.
Note: Requires commercial API access from Hometrack.
"""
from typing import Any, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.core.dependencies import check_role
from app.services.zoopla_service import zoopla_service
from app.services.zoopla_auth import zoopla_auth_service

router = APIRouter()


@router.get("/status")
async def get_zoopla_status(
    current_user: dict = Depends(check_role(["admin"]))
) -> Any:
    """
    Get Zoopla API integration status.
    
    Returns:
    - enabled: Whether Zoopla API is enabled
    - configured: Whether credentials are configured
    - access_granted: Whether API access has been granted
    """
    is_enabled = zoopla_auth_service.is_enabled()
    
    return {
        "enabled": is_enabled,
        "configured": bool(zoopla_auth_service.client_id and zoopla_auth_service.client_secret),
        "access_granted": is_enabled,
        "message": "Zoopla API requires commercial agreement with Hometrack. Contact https://www.hometrack.com/contact-us/ for access." if not is_enabled else "Zoopla API is configured and ready to use.",
        "documentation": "https://developers.zoopla.co.uk/docs/leads-rest-api"
    }


@router.post("/sync")
async def sync_zoopla_listings(
    postcode: Optional[str] = Query(None, description="Filter by postcode"),
    min_price: Optional[float] = Query(None, description="Minimum price"),
    max_price: Optional[float] = Query(None, description="Maximum price"),
    limit: int = Query(50, ge=1, le=100, description="Maximum listings to sync"),
    current_user: dict = Depends(check_role(["admin"]))
) -> Any:
    """
    Sync listings from Zoopla API to our database.
    
    **Note**: This endpoint will only work when Zoopla API access is granted.
    Contact Hometrack (https://www.hometrack.com/contact-us/) for commercial access.
    
    **Parameters**:
    - postcode: Filter listings by postcode
    - min_price: Minimum price filter
    - max_price: Maximum price filter
    - limit: Maximum number of listings to sync (1-100)
    
    **Returns**:
    - Sync results with counts of processed, added, updated, and errors
    """
    if not zoopla_auth_service.is_enabled():
        raise HTTPException(
            status_code=503,
            detail={
                "error": "Zoopla API is not enabled",
                "message": "Zoopla API requires commercial agreement with Hometrack. Contact https://www.hometrack.com/contact-us/ for access.",
                "contact": "https://www.hometrack.com/contact-us/",
                "documentation": "https://developers.zoopla.co.uk/docs/leads-rest-api"
            }
        )
    
    # Build filters
    filters: Dict[str, Any] = {}
    if postcode:
        filters["postcode"] = postcode
    if min_price:
        filters["min_price"] = min_price
    if max_price:
        filters["max_price"] = max_price
    
    # Sync listings
    results = await zoopla_service.sync_listings(filters, limit)
    
    if not results.get("success"):
        raise HTTPException(
            status_code=500,
            detail=results
        )
    
    return {
        "message": "Zoopla listings synced successfully",
        **results
    }


@router.post("/test-auth")
async def test_zoopla_auth(
    current_user: dict = Depends(check_role(["admin"]))
) -> Any:
    """
    Test Zoopla API authentication.
    
    This endpoint tests if Zoopla API credentials are valid and can obtain an access token.
    """
    if not zoopla_auth_service.is_enabled():
        return {
            "success": False,
            "message": "Zoopla API is not enabled. Configure ZOOPLA_CLIENT_ID and ZOOPLA_CLIENT_SECRET in environment variables.",
            "configured": False
        }
    
    try:
        token = await zoopla_auth_service.get_access_token(force_refresh=True)
        
        if token:
            return {
                "success": True,
                "message": "Zoopla API authentication successful",
                "token_obtained": True,
                "token_length": len(token),
                "configured": True
            }
        else:
            return {
                "success": False,
                "message": "Failed to obtain access token. Check credentials.",
                "token_obtained": False,
                "configured": True
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"Authentication test failed: {str(e)}",
            "error": str(e),
            "configured": True
        }
