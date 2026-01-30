import os
from typing import Any, Optional, cast

# Use sync client only to avoid loading async client (which can trigger
# ImportError: AsyncRPCFilterRequestBuilder with some supabase/postgrest versions)
try:
    from supabase._sync.client import create_client, Client
except ImportError:
    from supabase import create_client, Client

from app.core.config import settings
from app.core.logging_config import get_logger

logger = get_logger(__name__)

# Connection pool configuration
_supabase_client: Optional[Client] = None
_admin_client: Optional[Client] = None


def get_supabase_client(use_service_role: bool = False) -> Client:
    """
    Get or create a Supabase client with connection pooling.
    
    Args:
        use_service_role: If True, uses service role key for admin operations.
                         If False, uses anon key for user-facing operations.
    
    Returns:
        Configured Supabase client
    """
    global _supabase_client, _admin_client
    
    try:
        if use_service_role:
            if _admin_client is None:
                key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or settings.SUPABASE_SERVICE_ROLE_KEY
                if not key:
                    logger.warning("Service role key not found, falling back to anon key")
                    key = settings.SUPABASE_ANON_KEY
                _admin_client = create_client(settings.SUPABASE_URL, key)
                logger.info("Supabase admin client initialized")
            return _admin_client
        else:
            if _supabase_client is None:
                _supabase_client = create_client(
                    settings.SUPABASE_URL,
                    settings.SUPABASE_ANON_KEY
                )
                logger.info("Supabase client initialized")
            return _supabase_client
    except Exception as e:
        logger.error(f"Failed to create Supabase client: {e}")
        raise


def get_supabase() -> Client:
    """
    Get Supabase client for admin operations (backward compatibility).
    Uses the service role key for backend operations that require bypass of RLS.
    """
    return get_supabase_client(use_service_role=True)


# Initialize global clients (lazy initialization)
supabase: Client = get_supabase()


def close_connections():
    """
    Close all database connections gracefully.
    Should be called on application shutdown.
    """
    global _supabase_client, _admin_client
    
    try:
        # Supabase Python client doesn't have explicit close method
        # But we can reset the globals to allow garbage collection
        _supabase_client = None
        _admin_client = None
        logger.info("Database connections closed")
    except Exception as e:
        logger.error(f"Error closing database connections: {e}")


def test_connection() -> bool:
    """
    Test database connection with error handling.
    
    Returns:
        True if connection successful, False otherwise
    """
    try:
        client = get_supabase_client(use_service_role=True)
        response = client.table("listings").select(
            "count", count=cast(Any, "exact")
        ).limit(1).execute()
        logger.info("Database connection test successful")
        return True
    except Exception as e:
        logger.error(f"Database connection test failed: {e}")
        return False

