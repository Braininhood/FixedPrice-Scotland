from typing import Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field

class SavedSearchBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    max_budget: Optional[float] = Field(None, gt=0)
    postcode: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    confidence_level: Optional[str] = Field(None, pattern="^(explicit|explicit_and_likely)$")
    is_active: bool = True

class SavedSearchCreate(SavedSearchBase):
    pass

class SavedSearchUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    max_budget: Optional[float] = Field(None, gt=0)
    postcode: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    confidence_level: Optional[str] = Field(None, pattern="^(explicit|explicit_and_likely)$")
    is_active: Optional[bool] = None

class SavedSearch(SavedSearchBase):
    id: UUID
    user_id: UUID
    last_notified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
