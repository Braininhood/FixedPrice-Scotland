import re
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, field_validator

# URL pattern for listing_url and agent_url (must be http/https)
_URL_PATTERN = re.compile(r"^https?://[^\s]+$", re.IGNORECASE)
class ListingBase(BaseModel):
    listing_url: str
    source: str
    address: str
    postcode: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    price_raw: str
    price_numeric: Optional[float] = None
    description: Optional[str] = None
    agent_name: Optional[str] = None
    agent_url: Optional[str] = None
    image_url: Optional[str] = None
    extra_image_urls: Optional[List[str]] = None
    is_active: bool = True

    @field_validator("listing_url")
    @classmethod
    def listing_url_must_be_valid(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("listing_url is required")
        if not _URL_PATTERN.match(v.strip()):
            raise ValueError("listing_url must be a valid HTTP or HTTPS URL")
        return v.strip()

    @field_validator("source")
    @classmethod
    def source_non_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("source is required")
        return v.strip()

    @field_validator("agent_url")
    @classmethod
    def agent_url_if_present_must_be_valid(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        v = v.strip()
        if not _URL_PATTERN.match(v):
            raise ValueError("agent_url must be a valid HTTP or HTTPS URL")
        return v


class ListingCreate(ListingBase):
    pass

class ListingUpdate(BaseModel):
    listing_url: Optional[str] = None
    source: Optional[str] = None
    address: Optional[str] = None
    postcode: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    price_raw: Optional[str] = None
    price_numeric: Optional[float] = None
    description: Optional[str] = None
    agent_name: Optional[str] = None
    agent_url: Optional[str] = None
    image_url: Optional[str] = None
    extra_image_urls: Optional[List[str]] = None
    is_active: Optional[bool] = None

    @field_validator("listing_url")
    @classmethod
    def listing_url_if_present_must_be_valid(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        v = v.strip()
        if not _URL_PATTERN.match(v):
            raise ValueError("listing_url must be a valid HTTP or HTTPS URL")
        return v

    @field_validator("agent_url")
    @classmethod
    def agent_url_if_present_must_be_valid(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        v = v.strip()
        if not _URL_PATTERN.match(v):
            raise ValueError("agent_url must be a valid HTTP or HTTPS URL")
        return v

class Listing(ListingBase):
    id: UUID
    first_seen_at: datetime
    last_checked_at: datetime
    updated_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True
