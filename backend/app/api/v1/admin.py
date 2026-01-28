"""
Admin-only endpoints for dashboard stats and platform management.
"""
from fastapi import APIRouter, Depends
from app.core.dependencies import check_role
from app.core.database import supabase

router = APIRouter()


@router.get("/stats")
async def admin_stats(current_user: dict = Depends(check_role(["admin"]))):
    """
    Return counts for users, listings, and subscriptions. Admin only.
    """
    users_resp = supabase.table("user_profiles").select("id", count="exact", head=True).execute()  # type: ignore[arg-type]
    listings_resp = supabase.table("listings").select("id", count="exact", head=True).execute()  # type: ignore[arg-type]
    subs_resp = supabase.table("subscriptions").select("id", count="exact", head=True).execute()  # type: ignore[arg-type]
    active_subs = supabase.table("subscriptions").select("id", count="exact", head=True).eq("status", "active").execute()  # type: ignore[arg-type]
    return {
        "users_count": getattr(users_resp, "count", None) or 0,
        "listings_count": getattr(listings_resp, "count", None) or 0,
        "subscriptions_count": getattr(subs_resp, "count", None) or 0,
        "active_subscriptions_count": getattr(active_subs, "count", None) or 0,
    }


@router.get("/analytics")
async def admin_analytics(current_user: dict = Depends(check_role(["admin"]))):
    """
    Extended analytics: counts by role, recent activity. Admin only.
    """
    users_resp = supabase.table("user_profiles").select("id, role, created_at").execute()
    users = users_resp.data if users_resp.data and isinstance(users_resp.data, list) else []
    by_role = {"admin": 0, "agent": 0, "buyer": 0}
    for u in users:
        if isinstance(u, dict) and u.get("role") in by_role:
            by_role[u["role"]] = by_role.get(u["role"], 0) + 1
    listings_resp = supabase.table("listings").select("id, created_at, is_active").execute()
    listings = listings_resp.data if listings_resp.data and isinstance(listings_resp.data, list) else []
    active_listings = sum(1 for l in listings if isinstance(l, dict) and l.get("is_active") is True)
    subs_resp = supabase.table("subscriptions").select("id, status, created_at").execute()
    subs = subs_resp.data if subs_resp.data and isinstance(subs_resp.data, list) else []
    by_status = {}
    for s in subs:
        if isinstance(s, dict) and s.get("status"):
            by_status[s["status"]] = by_status.get(s["status"], 0) + 1
    return {
        "users_total": len(users),
        "users_by_role": by_role,
        "listings_total": len(listings),
        "listings_active": active_listings,
        "subscriptions_total": len(subs),
        "subscriptions_by_status": by_status,
    }
