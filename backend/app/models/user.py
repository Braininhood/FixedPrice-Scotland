from enum import Enum
from typing import Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr

class UserRole(str, Enum):
    BUYER = "buyer"
    SELLER = "seller"
    AGENT = "agent"
    ADMIN = "admin"

class UserProfileBase(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: UserRole = UserRole.BUYER
    phone: Optional[str] = None

class UserProfileCreate(UserProfileBase):
    id: UUID

class UserProfileUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    phone: Optional[str] = None

class UserProfile(UserProfileBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    CANCELED = "canceled"
    PAST_DUE = "past_due"
    TRIALING = "trialing"

class PlanType(str, Enum):
    BUYER_MONTHLY = "buyer_monthly"
    BUYER_YEARLY = "buyer_yearly"
    AGENT_VERIFICATION = "agent_verification"

class SubscriptionBase(BaseModel):
    user_id: UUID
    stripe_subscription_id: Optional[str] = None
    stripe_customer_id: Optional[str] = None
    plan_type: PlanType
    status: SubscriptionStatus
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool = False

class Subscription(SubscriptionBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
