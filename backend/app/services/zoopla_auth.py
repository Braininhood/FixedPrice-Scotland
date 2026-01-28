"""
Zoopla API OAuth2 Authentication Service

Handles OAuth2 client credentials flow for Zoopla API access.
This service is prepared for when commercial API access is granted.
"""
import os
import time
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import httpx
from app.core.config import settings


class ZooplaAuthService:
    """
    Handles OAuth2 authentication for Zoopla APIs.
    
    Note: Zoopla API access requires commercial agreement with Hometrack.
    This service is prepared but will not work until API credentials are provided.
    """
    
    def __init__(self):
        self.client_id = settings.ZOOPLA_CLIENT_ID
        self.client_secret = settings.ZOOPLA_CLIENT_SECRET
        self.audience = settings.ZOOPLA_AUDIENCE
        self.auth_url = settings.ZOOPLA_AUTH_URL
        self.enabled = settings.ZOOPLA_ENABLED
        
        # Token cache
        self._access_token: Optional[str] = None
        self._token_expires_at: Optional[datetime] = None
    
    def is_enabled(self) -> bool:
        """Check if Zoopla API is enabled and configured."""
        return (
            self.enabled and
            bool(self.client_id) and
            bool(self.client_secret)
        )
    
    async def get_access_token(self, force_refresh: bool = False) -> Optional[str]:
        """
        Get a valid access token, using cache if available.
        
        Args:
            force_refresh: Force token refresh even if cached token is valid
            
        Returns:
            Access token string, or None if authentication fails
        """
        if not self.is_enabled():
            return None
        
        # Check if we have a valid cached token
        if not force_refresh and self._access_token and self._token_expires_at:
            if datetime.now() < self._token_expires_at - timedelta(seconds=60):  # 1 min buffer
                return self._access_token
        
        # Request new token
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.auth_url,
                    data={
                        "grant_type": "client_credentials",
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "audience": self.audience
                    },
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self._access_token = data.get("access_token")
                    
                    # Calculate expiry (default to 1 hour if not provided)
                    expires_in = data.get("expires_in", 3600)
                    self._token_expires_at = datetime.now() + timedelta(seconds=expires_in)
                    
                    return self._access_token
                else:
                    print(f"Zoopla auth failed: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            print(f"Error authenticating with Zoopla: {e}")
            return None
    
    def get_auth_headers(self, token: Optional[str] = None) -> Dict[str, str]:
        """
        Get authorization headers for API requests.
        
        Args:
            token: Access token (if None, will use cached token)
            
        Returns:
            Dictionary with Authorization header
        """
        if not self.is_enabled():
            return {}
        
        access_token = token or self._access_token
        if not access_token:
            return {}
        
        return {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
    
    def clear_token_cache(self):
        """Clear the cached access token (useful for testing or forced refresh)."""
        self._access_token = None
        self._token_expires_at = None


# Singleton instance
zoopla_auth_service = ZooplaAuthService()
