from enum import Enum
from typing import Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel

class PaymentStatus(str, Enum):
    SUCCEEDED = "succeeded"
    PENDING = "pending"
    FAILED = "failed"
    REFUNDED = "refunded"

class PaymentBase(BaseModel):
    user_id: Optional[UUID] = None
    subscription_id: Optional[UUID] = None
    stripe_payment_intent_id: Optional[str] = None
    stripe_charge_id: Optional[str] = None
    amount: float
    currency: str = "gbp"
    status: PaymentStatus
    payment_method: Optional[str] = None
    description: Optional[str] = None
    metadata: Optional[dict] = None

class Payment(PaymentBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
