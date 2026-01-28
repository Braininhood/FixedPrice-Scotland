from datetime import datetime, timedelta, timezone
from typing import Any, Union, Optional
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = settings.ALGORITHM

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    """
    Create a JWT access token with timezone-aware expiration.
    Uses timezone-aware datetime to avoid deprecation warnings in Python 3.12+.
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=60 * 24 * 8  # 8 days
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# Lazy-initialized JWKS client for Supabase (new JWT Signing Keys)
_supabase_jwks_client: Optional[Any] = None


def _get_supabase_jwks_client():
    global _supabase_jwks_client
    if _supabase_jwks_client is None:
        from jwt import PyJWKClient
        base = (settings.SUPABASE_URL or "").rstrip("/")
        jwks_uri = f"{base}/auth/v1/.well-known/jwks.json"
        _supabase_jwks_client = PyJWKClient(jwks_uri, cache_keys=True)
    return _supabase_jwks_client


def verify_supabase_jwt(token: str) -> Optional[dict]:
    """
    Verifies a JWT issued by Supabase.
    Supports multiple algorithms: ES256 (JWKS), RS256 (JWKS), and HS256 (legacy).
    """
    import logging
    import jwt as pyjwt
    logger = logging.getLogger(__name__)
    
    # Method 1: Try JWKS with ES256/RS256 (new Supabase projects)
    try:
        from jwt import PyJWKClient
        client = _get_supabase_jwks_client()
        signing_key = client.get_signing_key_from_jwt(token)
        payload = pyjwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256"],  # Support both elliptic curve and RSA
            options={"verify_aud": False, "verify_exp": True},
        )
        return payload
    except Exception as e:
        logger.debug(f"JWKS validation failed: {type(e).__name__}, trying HS256...")
    
    # Method 2: Try HS256 with JWT secret (legacy Supabase or custom tokens)
    try:
        # Use SUPABASE_JWT_SECRET if available, fall back to service role key or JWT_SECRET
        jwt_secret = settings.SUPABASE_JWT_SECRET or settings.SUPABASE_SERVICE_ROLE_KEY or settings.JWT_SECRET
        if not jwt_secret:
            logger.error("No JWT secret available for HS256 validation")
            return None
            
        payload = pyjwt.decode(
            token,
            jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False, "verify_exp": True},
        )
        logger.info("JWT validated successfully with HS256")
        return payload
    except Exception as e:
        logger.error(f"All JWT validation methods failed. Last error: {type(e).__name__}: {str(e)}")
        return None
