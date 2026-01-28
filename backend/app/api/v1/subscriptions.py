import logging
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.dependencies import get_current_user, check_role
from app.core.database import supabase
from app.models.user import PlanType
from app.services.subscription_service import subscription_service
from app.services.email_service import EmailService
from uuid import UUID

from typing import Any, Optional

logger = logging.getLogger(__name__)

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


class AdminCreateSubscriptionBody(BaseModel):
    user_id: UUID
    plan_type: PlanType
    status: str = "active"


class AdminUpdateSubscriptionBody(BaseModel):
    status: Optional[str] = None
    cancel_at_period_end: Optional[bool] = None

@router.get("/me")
@limiter.limit("30/minute")  # Rate limit: 30 requests per minute
async def get_my_subscription(request: Request, current_user: dict = Depends(get_current_user)):
    """
    Get the current user's subscription status.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
        
    subscription = await subscription_service.get_user_subscription(UUID(str(user_id)))
    if not subscription:
        return {"status": "inactive", "plan": "free"}
    return subscription

@router.post("/subscribe")
@limiter.limit("5/minute")  # Rate limit: 5 subscription requests per minute
async def request_subscription(
    request: Request,
    plan_type: PlanType,
    current_user: dict = Depends(get_current_user)
):
    """
    Request a subscription. 
    Currently sends a bank transfer invoice notice.
    Buyers cannot subscribe to agent_verification plans.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    
    # Check user role and prevent buyers from subscribing to agent plans
    from app.core.database import supabase
    user_profile_response = supabase.table("user_profiles").select("role").eq("id", str(user_id)).single().execute()
    user_role = None
    if user_profile_response.data and isinstance(user_profile_response.data, dict):
        user_role = user_profile_response.data.get("role")
    
    if user_role == "buyer" and plan_type == PlanType.AGENT_VERIFICATION:
        raise HTTPException(
            status_code=403,
            detail="Buyers cannot subscribe to agent verification plans. Please choose a buyer plan instead."
        )
        
    return await subscription_service.create_subscription_request(UUID(str(user_id)), plan_type)

@router.post("/cancel")
@limiter.limit("5/minute")  # Rate limit: 5 cancellation requests per minute
async def cancel_subscription(
    request: Request,
    cancel_immediately: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """
    Cancel the current user's subscription.
    If cancel_immediately is False, subscription continues until period_end.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    
    try:
        return await subscription_service.cancel_subscription(UUID(str(user_id)), cancel_immediately)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/payments")
@limiter.limit("30/minute")  # Rate limit: 30 requests per minute
async def get_payment_history(request: Request, current_user: dict = Depends(get_current_user)):
    """
    Get payment history for the current user.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    
    payments = await subscription_service.get_payment_history(UUID(str(user_id)))
    return {"payments": payments}


@router.get("/all")
@limiter.limit("60/minute")
async def list_all_subscriptions(
    request: Request,
    skip: int = Query(0, ge=0, le=10000),
    limit: int = Query(50, ge=1, le=100),
    status_filter: str | None = Query(None, description="Filter by status: active, canceled, past_due, etc."),
    current_user: dict = Depends(check_role(["admin"])),
):
    """
    List all subscriptions with user info. Admin only.
    """
    from app.core.database import supabase
    query = (
        supabase.table("subscriptions")
        .select("id, user_id, plan_type, status, current_period_end, cancel_at_period_end, created_at")
        .order("created_at", desc=True)
        .range(skip, skip + limit - 1)
    )
    if status_filter:
        query = query.eq("status", status_filter)
    resp = query.execute()
    raw = resp.data if resp.data and isinstance(resp.data, list) else []
    rows: list[dict[str, Any]] = [r for r in raw if isinstance(r, dict)]
    user_ids = list({str(r["user_id"]) for r in rows if r.get("user_id")})
    users_map: dict[str, dict[str, Any]] = {}
    if user_ids:
        users_resp = supabase.table("user_profiles").select("id, email, full_name").in_("id", user_ids).execute()
        if users_resp.data and isinstance(users_resp.data, list):
            for u in users_resp.data:
                if isinstance(u, dict) and u.get("id"):
                    users_map[str(u["id"])] = u
    for r in rows:
        uid = r.get("user_id")
        r["user"] = users_map.get(str(uid), {}) if uid is not None else {}
    count_query = supabase.table("subscriptions").select("*", count="exact", head=True)  # type: ignore[arg-type]
    if status_filter:
        count_query = count_query.eq("status", status_filter)
    total_resp = count_query.execute()
    total = getattr(total_resp, "count", None) or len(rows)
    return {"subscriptions": rows, "total": total}


@router.post("/", status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
async def admin_create_subscription(
    request: Request,
    body: AdminCreateSubscriptionBody,
    current_user: dict = Depends(check_role(["admin"])),
):
    """Create a subscription for a user. Admin only."""
    uid = str(body.user_id)
    now = datetime.now(timezone.utc)
    period_end = now + timedelta(days=30 if "monthly" in body.plan_type.value else 365)
    row = {
        "user_id": uid,
        "plan_type": body.plan_type.value,
        "status": body.status,
        "current_period_start": now.isoformat(),
        "current_period_end": period_end.isoformat(),
        "cancel_at_period_end": False,
    }
    resp = supabase.table("subscriptions").insert(row).execute()
    if not resp.data or not isinstance(resp.data, list) or len(resp.data) == 0:
        raise HTTPException(status_code=400, detail="Failed to create subscription")
    created: Any = resp.data[0]
    
    # Send email notification if subscription is active
    if body.status == "active":
        try:
            user_response = supabase.table("user_profiles").select("email, full_name").eq("id", uid).single().execute()
            if user_response.data and isinstance(user_response.data, dict):
                email_value = user_response.data.get("email", "")
                full_name_value = user_response.data.get("full_name", "Valued Member")
                if email_value and isinstance(email_value, str):
                    plan_names = {
                        "buyer_monthly": "Buyer Premium (Monthly)",
                        "buyer_yearly": "Buyer Premium (Yearly)",
                        "agent_verification": "Verified Agent"
                    }
                    plan_name = plan_names.get(body.plan_type.value, body.plan_type.value)
                    await EmailService.send_subscription_activated_email(
                        email=email_value,
                        full_name=full_name_value if isinstance(full_name_value, str) else "Valued Member",
                        plan_name=plan_name,
                        plan_type=body.plan_type.value
                    )
        except Exception as e:
            logger.error(f"Failed to send subscription activated email: {e}", exc_info=True)
            # Don't fail the request if email fails
    
    return created


@router.patch("/{subscription_id}")
@limiter.limit("30/minute")
async def admin_update_subscription(
    request: Request,
    subscription_id: UUID,
    body: AdminUpdateSubscriptionBody,
    current_user: dict = Depends(check_role(["admin"])),
):
    """Update subscription status or cancel_at_period_end. Admin only."""
    sid = str(subscription_id)
    
    # Get existing subscription to check status change
    existing_resp = supabase.table("subscriptions").select("user_id, plan_type, status").eq("id", sid).single().execute()
    if not existing_resp.data or not isinstance(existing_resp.data, dict):
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    old_status = existing_resp.data.get("status")
    user_id = existing_resp.data.get("user_id")
    plan_type = existing_resp.data.get("plan_type")
    
    update_data = body.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # When activating a pending subscription, set period dates if missing
    if update_data.get("status") == "active":
        existing = supabase.table("subscriptions").select("current_period_start, current_period_end").eq("id", sid).execute()
        if existing.data and isinstance(existing.data, list) and len(existing.data) > 0:
            first: Any = existing.data[0]
            if isinstance(first, dict) and (not first.get("current_period_start") or not first.get("current_period_end")):
                now = datetime.now(timezone.utc)
                period_end = now + timedelta(days=30)  # default monthly
                update_data["current_period_start"] = now.isoformat()
                update_data["current_period_end"] = period_end.isoformat()
    
    resp = supabase.table("subscriptions").update(update_data).eq("id", sid).execute()
    if not resp.data or not isinstance(resp.data, list) or len(resp.data) == 0:
        raise HTTPException(status_code=404, detail="Subscription not found")
    updated: Any = resp.data[0]
    new_status = update_data.get("status", old_status)
    
    # Send email notifications for status changes
    if user_id and new_status != old_status:
        try:
            user_response = supabase.table("user_profiles").select("email, full_name").eq("id", str(user_id)).single().execute()
            if user_response.data and isinstance(user_response.data, dict):
                email_value = user_response.data.get("email", "")
                full_name_value = user_response.data.get("full_name", "Valued Member")
                if email_value and isinstance(email_value, str):
                    plan_names = {
                        "buyer_monthly": "Buyer Premium (Monthly)",
                        "buyer_yearly": "Buyer Premium (Yearly)",
                        "agent_verification": "Verified Agent"
                    }
                    plan_name = plan_names.get(plan_type, plan_type) if isinstance(plan_type, str) else "Subscription"
                    
                    if new_status == "active" and old_status != "active":
                        # Subscription activated
                        await EmailService.send_subscription_activated_email(
                            email=email_value,
                            full_name=full_name_value if isinstance(full_name_value, str) else "Valued Member",
                            plan_name=plan_name,
                            plan_type=plan_type if isinstance(plan_type, str) else ""
                        )
                    elif new_status in ["canceled", "past_due", "inactive"] and old_status == "active":
                        # Subscription deactivated
                        reason = f"Subscription {new_status}"
                        await EmailService.send_subscription_deactivated_email(
                            email=email_value,
                            full_name=full_name_value if isinstance(full_name_value, str) else "Valued Member",
                            plan_name=plan_name,
                            reason=reason
                        )
        except Exception as e:
            logger.error(f"Failed to send subscription status change email: {e}", exc_info=True)
            # Don't fail the request if email fails
    
    return updated
