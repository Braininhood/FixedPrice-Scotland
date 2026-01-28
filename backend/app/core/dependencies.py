from typing import Generator, Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from app.core.config import settings
from app.core.security import verify_supabase_jwt
from app.core.database import get_supabase_client

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token",
    auto_error=False,  # Return None when no/invalid token; we raise 401 in get_current_user
)

# Use admin client for role checks (needs service_role permissions)
def get_admin_supabase():
    return get_supabase_client(use_service_role=True)

async def get_current_user(
    token: Optional[str] = Depends(reusable_oauth2)
) -> dict:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    payload = verify_supabase_jwt(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    return {"id": user_id}

async def get_optional_user(request: Request) -> Optional[dict]:
    """
    Optional user dependency - returns None if no token or invalid token.
    Used for endpoints that work both with and without authentication.
    Silently returns None for any auth errors - endpoint should work without auth.
    """
    try:
        authorization = request.headers.get("Authorization")
        if not authorization:
            return None
        
        # Extract token from "Bearer <token>"
        try:
            scheme, token = authorization.split()
            if scheme.lower() != "bearer":
                return None
        except ValueError:
            return None
        
        payload = verify_supabase_jwt(token)
        if not payload:
            return None
        user_id = payload.get("sub")
        if not user_id:
            return None
        return {"id": user_id}
    except Exception:
        # Silently fail for optional auth - endpoint will work without it
        return None

def check_role(allowed_roles: list):
    async def role_checker(current_user: dict = Depends(get_current_user)):
        # Query Supabase for the user's role
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            user_id = current_user["id"]
            logger.info(f"Checking role for user ID: {user_id}")
            
            supabase = get_admin_supabase()
            user_profile = supabase.table("user_profiles").select("role").eq("id", user_id).single().execute()
            
            logger.info(f"Profile data for {user_id}: {user_profile.data}")
            
            if not user_profile.data or user_profile.data.get("role") not in allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="The user doesn't have enough privileges",
                )
            return current_user
        except HTTPException:
            raise
        except Exception as e:
            # Handle case where user profile doesn't exist yet
            logger.error(f"Failed to fetch user profile for role check. User ID: {current_user.get('id')}, Error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User profile not found. Please contact support.",
            )
    return role_checker


def get_current_user_with_role(allowed_roles: list):
    """Like check_role but returns dict with id and role for branching (e.g. admin vs agent)."""
    async def dependency(current_user: dict = Depends(get_current_user)):
        import logging
        logger = logging.getLogger(__name__)
        try:
            user_id = current_user["id"]
            supabase = get_admin_supabase()
            user_profile = supabase.table("user_profiles").select("role").eq("id", user_id).single().execute()
            if not user_profile.data or user_profile.data.get("role") not in allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="The user doesn't have enough privileges",
                )
            return {"id": user_id, "role": user_profile.data.get("role") or "buyer"}
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to fetch user profile. User ID: {current_user.get('id')}, Error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User profile not found. Please contact support.",
            )
    return dependency

async def check_active_subscription(current_user: dict = Depends(get_current_user)):
    # Query Supabase for active subscription
    supabase = get_admin_supabase()
    subscription = supabase.table("subscriptions").select("status").eq("user_id", current_user["id"]).eq("status", "active").execute()
    
    if not subscription.data or not isinstance(subscription.data, list) or len(subscription.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active subscription required",
        )
    return current_user
