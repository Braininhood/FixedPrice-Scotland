from enum import Enum
from typing import Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field

class ClassificationStatus(str, Enum):
    EXPLICIT = "explicit"
    LIKELY = "likely"
    COMPETITIVE = "competitive"

class ClassificationBase(BaseModel):
    listing_id: UUID
    status: ClassificationStatus
    confidence_score: int = Field(ge=0, le=100)
    classification_reason: Optional[str] = None
    ai_model_used: Optional[str] = None

class ClassificationCreate(ClassificationBase):
    pass

class Classification(ClassificationBase):
    id: UUID
    classified_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True
