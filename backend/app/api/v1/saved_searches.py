from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.dependencies import get_current_user, check_active_subscription
from app.core.database import supabase
from app.models.saved_search import SavedSearch, SavedSearchCreate, SavedSearchUpdate

router = APIRouter()

@router.get("/", response_model=List[dict])
async def get_my_saved_searches(current_user: dict = Depends(check_active_subscription)):
    """
    Get all saved searches for the current user.
    Requires active subscription.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found")
    
    response = supabase.table("user_saved_searches").select("*").eq("user_id", str(user_id)).order("created_at", desc=True).execute()
    
    return response.data if response.data and isinstance(response.data, list) else []

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_saved_search(
    search: SavedSearchCreate,
    current_user: dict = Depends(check_active_subscription)
):
    """
    Create a new saved search.
    Requires active subscription.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found")
    
    search_data = search.model_dump()
    search_data["user_id"] = str(user_id)
    
    response = supabase.table("user_saved_searches").insert(search_data).execute()
    
    if not response.data or not isinstance(response.data, list):
        raise HTTPException(status_code=400, detail="Error creating saved search")
    
    return response.data[0]

@router.put("/{search_id}", response_model=dict)
async def update_saved_search(
    search_id: UUID,
    search_update: SavedSearchUpdate,
    current_user: dict = Depends(check_active_subscription)
):
    """
    Update a saved search.
    Requires active subscription.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found")
    
    update_data = search_update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Verify ownership
    check_response = supabase.table("user_saved_searches").select("user_id").eq("id", str(search_id)).single().execute()
    if not check_response.data or not isinstance(check_response.data, dict):
        raise HTTPException(status_code=404, detail="Saved search not found")
    
    if check_response.data.get("user_id") != str(user_id):
        raise HTTPException(status_code=403, detail="Not authorized to update this search")
    
    response = supabase.table("user_saved_searches").update(update_data).eq("id", str(search_id)).execute()
    
    if not response.data or not isinstance(response.data, list):
        raise HTTPException(status_code=404, detail="Saved search not found")
    
    return response.data[0]

@router.delete("/{search_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_saved_search(
    search_id: UUID,
    current_user: dict = Depends(check_active_subscription)
):
    """
    Delete a saved search.
    Requires active subscription.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found")
    
    # Verify ownership
    check_response = supabase.table("user_saved_searches").select("user_id").eq("id", str(search_id)).single().execute()
    if not check_response.data or not isinstance(check_response.data, dict):
        raise HTTPException(status_code=404, detail="Saved search not found")
    
    if check_response.data.get("user_id") != str(user_id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this search")
    
    supabase.table("user_saved_searches").delete().eq("id", str(search_id)).execute()
    
    return None
