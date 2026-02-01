from typing import Optional
from pydantic import BaseModel, Field, HttpUrl, validator

class ManualListingInput(BaseModel):
    """Pydantic model for manual listing entry with validation."""
    listing_url: str = Field(..., description="URL of the property listing")
    source: str = Field(..., description="Source: rightmove, zoopla, espc, s1homes, onthemarket, agent, or other")
    address: str = Field(..., min_length=5, description="Full address of the property")
    postcode: Optional[str] = Field(None, description="Postcode (optional but recommended)")
    city: Optional[str] = Field(None, description="City name")
    region: Optional[str] = Field(None, description="Region/County")
    price_raw: str = Field(..., min_length=1, description="Raw price text (e.g., 'Fixed Price £250,000')")
    price_numeric: Optional[float] = Field(None, ge=0, description="Numeric price (auto-parsed if not provided)")
    description: Optional[str] = Field(None, description="Property description")
    agent_name: Optional[str] = Field(None, description="Estate agent name")
    agent_url: Optional[str] = Field(None, description="Estate agent website URL")
    image_url: Optional[str] = Field(None, description="URL to primary/thumbnail property image")
    is_active: bool = Field(True, description="Whether the listing is active")
    
    @validator("source")
    def validate_source(cls, v):
        valid_sources = ["rightmove", "zoopla", "espc", "s1homes", "onthemarket", "agent", "other"]
        if v.lower() not in valid_sources:
            raise ValueError(f"Source must be one of: {', '.join(valid_sources)}")
        return v.lower()
    
    @validator("listing_url")
    def validate_url(cls, v):
        if not v or len(v.strip()) < 10:
            raise ValueError("URL must be at least 10 characters")
        return v.strip()

class PostcodeStatsInput(BaseModel):
    """Pydantic model for manually adding postcode statistics."""
    postcode: str = Field(..., description="Postcode (e.g., 'EH1 1AA' or 'EH1')")
    avg_sale_over_asking: float = Field(..., ge=0, le=100, description="Average sale price over asking price as percentage")
    total_sales: int = Field(0, ge=0, description="Total number of sales in this postcode")
    fixed_price_friendliness: str = Field(..., description="Fixed price friendliness: 'high', 'medium', or 'low'")
    
    @validator("fixed_price_friendliness")
    def validate_friendliness(cls, v):
        valid_values = ["high", "medium", "low"]
        if v.lower() not in valid_values:
            raise ValueError(f"Fixed price friendliness must be one of: {', '.join(valid_values)}")
        return v.lower()
    
    @validator("postcode")
    def normalize_postcode(cls, v):
        # Normalize postcode: remove spaces, uppercase
        return v.replace(" ", "").upper()
