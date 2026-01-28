import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.core.dependencies import get_current_user, check_role
from app.core.database import supabase
from app.services.email_service import EmailService
from app.models.user import UserProfileUpdate, UserRole
from uuid import UUID

logger = logging.getLogger(__name__)

router = APIRouter()


class UpdateRoleBody(BaseModel):
    role: UserRole


class AdminCreateUserBody(BaseModel):
    email: str
    password: str
    full_name: str = "User"
    role: UserRole = UserRole.BUYER


class AdminUpdateUserBody(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None


@router.get("/me")
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    """
    Get the current user's profile.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found")
    
    response = supabase.table("user_profiles").select("*").eq("id", str(user_id)).single().execute()
    
    if not response.data or not isinstance(response.data, dict):
        raise HTTPException(status_code=404, detail="User profile not found")
    
    return response.data

@router.put("/me")
async def update_my_profile(
    profile_update: UserProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update the current user's profile. Role cannot be changed here; only admins can change roles via PATCH /users/{id}/role.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found")
    
    update_data = profile_update.model_dump(exclude_unset=True)
    update_data.pop("role", None)  # Only admin can change role via admin endpoint
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    response = supabase.table("user_profiles").update(update_data).eq("id", str(user_id)).execute()
    
    if not response.data or not isinstance(response.data, list) or len(response.data) == 0:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    return response.data[0]

@router.get("/saved-searches")
async def get_my_saved_searches(current_user: dict = Depends(get_current_user)):
    """
    Get the current user's saved searches.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found")
    
    response = supabase.table("user_saved_searches").select("*").eq("user_id", str(user_id)).order("created_at", desc=True).execute()
    
    return {"searches": response.data if response.data and isinstance(response.data, list) else []}

@router.post("/onboard")
async def onboard_user(current_user: dict = Depends(get_current_user)):
    """
    Called after first login/signup to send welcome email and ensure profile is ready.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found")
        
    # Get user profile
    response = supabase.table("user_profiles").select("*").eq("id", str(user_id)).single().execute()
    
    if response.data and isinstance(response.data, dict):
        user_profile = response.data
        
        # Check if welcome email already sent (optional: could add a field to user_profiles)
        # For now, we just send it. The service handles multiple recipients if needed.
        try:
            email_value = user_profile.get("email", "")
            if not email_value or not isinstance(email_value, str):
                return {"message": "User profile found but email address is missing or invalid."}
            
            full_name_value = user_profile.get("full_name", "Valued Member")
            if not isinstance(full_name_value, str):
                full_name_value = "Valued Member"
            
            await EmailService.send_welcome_email(
                email=email_value,
                full_name=full_name_value
            )
            return {"message": "Onboarding successful, welcome email sent."}
        except ValueError as e:
            # Email service not configured
            logger.warning(f"Welcome email not sent: {str(e)}")
            return {"message": "Onboarding successful, but email service is not configured. Please contact support."}
        except Exception as e:
            logger.error(f"Failed to send welcome email: {e}", exc_info=True)
            return {"message": "Onboarding successful, but email failed to send. Please check email configuration."}
            
    return {"message": "User profile not found yet."}


@router.get("/", summary="List users (admin only)")
async def list_users(
    current_user: dict = Depends(check_role(["admin"])),
):
    """
    List all user profiles (id, email, full_name, role, phone). Admin only.
    """
    response = supabase.table("user_profiles").select("id, email, full_name, role, phone, created_at").order("created_at", desc=True).execute()
    data = response.data if response.data and isinstance(response.data, list) else []
    return {"users": data}


@router.post("/", summary="Create user (admin only)", status_code=status.HTTP_201_CREATED)
async def admin_create_user(
    body: AdminCreateUserBody,
    current_user: dict = Depends(check_role(["admin"])),
):
    """
    Create a new auth user and profile. Admin only. Uses Supabase Auth Admin API.
    """
    try:
        auth_resp = supabase.auth.admin.create_user(
            {
                "email": body.email,
                "password": body.password,
                "email_confirm": True,
                "user_metadata": {"full_name": body.full_name},
            }
        )
    except Exception as e:
        err_str = str(e).lower()
        if "already" in err_str or "registered" in err_str:
            raise HTTPException(status_code=400, detail="User with this email already exists")
        raise HTTPException(status_code=400, detail=str(e))
    user = auth_resp.user if hasattr(auth_resp, "user") else (auth_resp if isinstance(auth_resp, dict) else None)
    if not user:
        raise HTTPException(status_code=500, detail="Failed to create user")
    uid = user.get("id") if isinstance(user, dict) else getattr(user, "id", None)
    email = user.get("email", body.email) if isinstance(user, dict) else getattr(user, "email", body.email)
    meta = user.get("user_metadata", {}) if isinstance(user, dict) else getattr(user, "user_metadata", {}) or {}
    full_name = meta.get("full_name", body.full_name) if isinstance(meta, dict) else body.full_name
    supabase.table("user_profiles").insert({
        "id": uid,
        "email": email,
        "full_name": full_name,
        "role": body.role.value,
    }).execute()
    profile_resp = supabase.table("user_profiles").select("*").eq("id", str(uid)).single().execute()
    return profile_resp.data if profile_resp.data else {"id": uid, "email": email, "full_name": full_name, "role": body.role.value}


@router.put("/{user_id}", summary="Update user (admin only)")
async def admin_update_user(
    user_id: UUID,
    body: AdminUpdateUserBody,
    current_user: dict = Depends(check_role(["admin"])),
):
    """
    Update any user's profile (full_name, phone, role). Admin only.
    """
    uid = str(user_id)
    update_data = body.model_dump(exclude_unset=True)
    if "role" in update_data:
        update_data["role"] = update_data["role"].value
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    response = supabase.table("user_profiles").update(update_data).eq("id", uid).execute()
    if not response.data or not isinstance(response.data, list) or len(response.data) == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return response.data[0]


@router.patch("/{user_id}/role", summary="Set user role (admin only)")
async def set_user_role(
    user_id: UUID,
    body: UpdateRoleBody,
    current_user: dict = Depends(check_role(["admin"])),
):
    """
    Set a user's role (admin, agent, buyer). Admin only.
    Sends email notification to user when role changes.
    """
    uid = str(user_id)
    
    # Get old role before updating
    old_role_response = supabase.table("user_profiles").select("role, email, full_name").eq("id", uid).single().execute()
    if not old_role_response.data or not isinstance(old_role_response.data, dict):
        raise HTTPException(status_code=404, detail="User not found")
    
    old_role = old_role_response.data.get("role", "buyer")
    email_value = old_role_response.data.get("email", "")
    full_name_value = old_role_response.data.get("full_name", "Valued Member")
    
    response = supabase.table("user_profiles").update({"role": body.role.value}).eq("id", uid).execute()
    if not response.data or not isinstance(response.data, list) or len(response.data) == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Send email notification if role changed
    if old_role != body.role.value and email_value and isinstance(email_value, str):
        try:
            await EmailService.send_role_changed_email(
                email=email_value,
                full_name=full_name_value if isinstance(full_name_value, str) else "Valued Member",
                old_role=old_role if isinstance(old_role, str) else "buyer",
                new_role=body.role.value
            )
        except Exception as e:
            logger.error(f"Failed to send role change email: {e}", exc_info=True)
            # Don't fail the request if email fails
    
    return response.data[0]


@router.delete("/{user_id}", summary="Delete user (admin only)")
async def delete_user(
    user_id: UUID,
    current_user: dict = Depends(check_role(["admin"])),
):
    """
    Delete a user and all associated data. Admin only.
    This will:
    - Delete the user from Supabase Auth (cascades to user_profiles, subscriptions, saved_searches)
    - Set listings.created_by_user_id to NULL (listings remain but are orphaned)
    - Set payments.user_id to NULL (payment records remain)
    - Set agents.user_id to NULL (agent records remain)
    """
    uid = str(user_id)
    current_user_id = current_user.get("id")
    
    # Prevent admin from deleting themselves
    if uid == current_user_id:
        raise HTTPException(
            status_code=400,
            detail="You cannot delete your own account"
        )
    
    # Check if user exists
    profile_response = supabase.table("user_profiles").select("id, email, role").eq("id", uid).single().execute()
    if not profile_response.data or not isinstance(profile_response.data, dict):
        raise HTTPException(status_code=404, detail="User not found")
    
    user_role = profile_response.data.get("role", "")
    
    # Prevent deleting other admins (optional safety check)
    if user_role == "admin":
        raise HTTPException(
            status_code=403,
            detail="Cannot delete another admin user. Please change their role first."
        )
    
    try:
        # Delete from Supabase Auth (this will cascade delete user_profiles, subscriptions, saved_searches)
        # The database constraints handle cascading automatically
        supabase.auth.admin.delete_user(uid)
        
        logger.info(f"User {uid} deleted by admin {current_user_id}")
        return {"message": "User deleted successfully"}
    except Exception as e:
        logger.error(f"Failed to delete user {uid}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete user: {str(e)}"
        )
