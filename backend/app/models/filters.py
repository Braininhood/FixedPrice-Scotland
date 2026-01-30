"""
Input validation models for API filters and query parameters.
Provides sanitization and validation for user inputs.
"""

from typing import Optional
from pydantic import BaseModel, Field, validator
import re


class ListingFilters(BaseModel):
    """Validated filters for listing queries."""
    
    skip: int = Field(default=0, ge=0, le=10000, description="Number of items to skip")
    limit: int = Field(default=100, ge=1, le=100, description="Max items to return")
    postcode: Optional[str] = Field(default=None, max_length=10, description="UK postcode filter")
    city: Optional[str] = Field(default=None, max_length=100, description="City name filter")
    max_price: Optional[float] = Field(default=None, ge=0, le=10000000, description="Maximum price filter")
    user_budget: Optional[float] = Field(default=None, ge=0, le=10000000, description="User budget for probability")
    confidence_level: Optional[str] = Field(default=None, description="Confidence level filter")
    
    @validator('postcode')
    def validate_postcode(cls, v):
        """Validate and normalize UK postcode. Empty treated as None; single character allowed for typing (e.g. G, E)."""
        if v is None:
            return None
        v = v.strip().upper()
        if not v:
            return None
        # Allow partial postcodes while typing (1–8 chars, alphanumeric + space)
        if not re.match(r'^[A-Z0-9\s]+$', v) or len(v) > 8:
            raise ValueError('Invalid postcode format')
        return v
    
    @validator('city')
    def validate_city(cls, v):
        """Validate and sanitize city name or postcode (location search). Comma-separated values allowed. Empty/whitespace treated as no filter."""
        if v is None:
            return None
        v = v.strip()
        if not v:
            return None
        # Allow letters, digits, spaces, hyphens, apostrophes, commas (single character ok while typing)
        if not re.match(r"^[a-zA-Z0-9\s\-',]+$", v):
            raise ValueError('Invalid city/location format')
        return v
    
    @validator('confidence_level')
    def validate_confidence_level(cls, v):
        """Validate confidence level value."""
        if v is None:
            return None
        allowed_values = ['explicit', 'explicit_and_likely', 'all']
        if v not in allowed_values:
            raise ValueError(f'Confidence level must be one of: {", ".join(allowed_values)}')
        return v


class SearchFilters(BaseModel):
    """Validated filters for saved search criteria."""
    
    name: str = Field(..., min_length=1, max_length=100, description="Search name")
    max_budget: Optional[float] = Field(default=None, ge=0, le=10000000)
    postcode: Optional[str] = Field(default=None, max_length=10)
    city: Optional[str] = Field(default=None, max_length=100)
    confidence_level: Optional[str] = Field(default='explicit_and_likely')
    is_active: bool = Field(default=True)
    
    @validator('name')
    def validate_name(cls, v):
        """Validate search name."""
        v = v.strip()
        if len(v) < 1:
            raise ValueError('Search name is required')
        # Remove any potentially dangerous characters
        v = re.sub(r'[<>\"\'&]', '', v)
        return v
    
    @validator('postcode')
    def validate_postcode(cls, v):
        """Validate and normalize UK postcode. Empty or single character allowed."""
        if v is None:
            return None
        v = v.strip().upper()
        if not v:
            return None
        if not re.match(r'^[A-Z0-9\s]+$', v) or len(v) > 8:
            raise ValueError('Invalid postcode format')
        return v
    
    @validator('city')
    def validate_city(cls, v):
        """Validate and sanitize city name or postcode (location search). Comma-separated allowed."""
        if v is None:
            return None
        v = v.strip()
        if not re.match(r"^[a-zA-Z0-9\s\-',]+$", v):
            raise ValueError('Invalid city/location format')
        return v
    
    @validator('confidence_level')
    def validate_confidence_level(cls, v):
        """Validate confidence level value."""
        if v is None:
            return None
        allowed_values = ['explicit', 'explicit_and_likely']
        if v not in allowed_values:
            raise ValueError(f'Confidence level must be one of: {", ".join(allowed_values)}')
        return v
