from typing import Callable, Any, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import ValidationError
from app.core.config import settings
from app.core.logging_config import setup_logging, get_logger
from app.core.error_handlers import (
    APIError,
    handle_validation_error,
    handle_api_error,
    handle_generic_error
)
from app.api.v1 import listings, subscriptions, webhooks, ingestion, users, saved_searches, classifications, zoopla, admin

# Initialize logging
setup_logging(level="INFO", log_file="app.log")
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager - replaces deprecated on_event.
    Handles startup and shutdown events.
    """
    # Startup
    logger.info("Starting FixedPrice Scotland API...")
    from app.core.database import test_connection
    if test_connection():
        logger.info("Database connection verified")
    else:
        logger.warning("Database connection test failed")
    
    yield
    
    # Shutdown
    logger.info("Shutting down FixedPrice Scotland API...")
    from app.core.database import close_connections
    close_connections()


# Rate limiting setup
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)
app.state.limiter = limiter


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    response = _rate_limit_exceeded_handler(request, exc)
    _add_cors_headers(response, request)
    return response


app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)  # type: ignore

# Register custom error handlers
@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    return handle_validation_error(exc)

@app.exception_handler(APIError)
async def api_exception_handler(request: Request, exc: APIError):
    return handle_api_error(exc)

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    # HTTPException should be handled by FastAPI's default handler
    if isinstance(exc, HTTPException):
        response = JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail}
        )
        _add_cors_headers(response, request)
        return response
    # All other exceptions
    return handle_generic_error(exc)

# CORS: ensure every response (including 401/403 from exception handler) gets CORS headers.
# Built early so handler is always used; origins list and helper defined next.
_cors_origins = [str(o) for o in (settings.CORS_ORIGINS or [])]
if not _cors_origins:
    _cors_origins = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8000", "http://127.0.0.1:8000", "http://0.0.0.0:8000", "http://localhost:3001", "http://127.0.0.1:3001"]


def _allow_origin(origin: str) -> bool:
    """
    Check if origin is allowed based on CORS configuration.
    In development (CORS_ALLOW_LOCALHOST_WILDCARD=True), allows all localhost/127.0.0.1 origins.
    In production (CORS_ALLOW_LOCALHOST_WILDCARD=False), only allows exact matches from CORS_ORIGINS.
    """
    if not origin:
        return False
    
    # Check exact match first
    if origin in _cors_origins:
        return True
    
    # In development mode, allow wildcard localhost (disable in production!)
    if settings.CORS_ALLOW_LOCALHOST_WILDCARD:
        return (
            origin.startswith("http://127.0.0.1:")
            or origin.startswith("http://localhost:")
            or origin.startswith("http://0.0.0.0:")
        )
    
    # Production: strict matching only
    return False


def _add_cors_headers(response: Response, request: Request) -> None:
    origin = request.headers.get("origin")
    if not origin or not _allow_origin(origin):
        return
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Expose-Headers"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning(f"HTTP {exc.status_code}: {exc.detail} - Path: {request.url.path}")
    response = JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    _add_cors_headers(response, request)
    return response


@app.exception_handler(404)
async def not_found_handler(request: Request, exc: Any) -> Response:
    """Ensure 404 responses include CORS headers."""
    logger.info(f"404 Not Found: {request.url.path}")
    detail = getattr(exc, "detail", "Not found")
    if isinstance(detail, str):
        content = {"detail": detail}
    else:
        content = {"detail": str(detail)}
    response = JSONResponse(status_code=404, content=content)
    _add_cors_headers(response, request)
    return response


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception: {str(exc)}")
    response = JSONResponse(status_code=500, content={"detail": "Internal server error"})
    _add_cors_headers(response, request)
    return response


# Public listings: GET /api/v1/listings and /api/v1/listings/ are on the listings router (no auth, declared before /{listing_id})
# Optional: expose same at /api/v1/public/listings for frontends that use that path
from app.api.v1.listings import get_listings as _get_listings_impl
from fastapi import Query

_LISTINGS_PREFIX = settings.API_V1_STR

@app.get(f"{_LISTINGS_PREFIX}/public/listings", response_model=list)
@app.get(f"{_LISTINGS_PREFIX}/public/listings/", response_model=list)
async def public_listings(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    postcode: Optional[str] = None,
    city: Optional[str] = None,
    max_price: Optional[float] = None,
    user_budget: Optional[float] = None,
    confidence_level: Optional[str] = Query(None, description="Filter by confidence"),
) -> Any:
    """Public list of listings - no authentication required (alias for /listings)."""
    return await _get_listings_impl(
        request, skip=skip, limit=limit, postcode=postcode, city=city,
        max_price=max_price, user_budget=user_budget, confidence_level=confidence_level,
    )

# Register API Routers
app.include_router(listings.router, prefix=f"{settings.API_V1_STR}/listings", tags=["listings"])
app.include_router(subscriptions.router, prefix=f"{settings.API_V1_STR}/subscriptions", tags=["subscriptions"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
app.include_router(saved_searches.router, prefix=f"{settings.API_V1_STR}/saved-searches", tags=["saved-searches"])
app.include_router(webhooks.router, prefix=f"{settings.API_V1_STR}/webhooks", tags=["webhooks"])
app.include_router(ingestion.router, prefix=f"{settings.API_V1_STR}/ingestion", tags=["ingestion"])
app.include_router(classifications.router, prefix=f"{settings.API_V1_STR}/classifications", tags=["classifications"])
app.include_router(zoopla.router, prefix=f"{settings.API_V1_STR}/zoopla", tags=["zoopla"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["admin"])

# Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        # Relaxed CSP for development - allows inline scripts and eval needed by Next.js
        # In production, use stricter CSP with nonces/hashes
        csp_policy = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://*.googleapis.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https: blob:; "
            "connect-src 'self' https://*.supabase.co https://*.googleapis.com wss://*.supabase.co; "
            "frame-src 'self' https://js.stripe.com; "
            "object-src 'none'; "
            "base-uri 'self'; "
            "form-action 'self'; "
            "frame-ancestors 'none'; "
            "upgrade-insecure-requests;"
        )
        response.headers["Content-Security-Policy"] = csp_policy
        return response

class CORSFixMiddleware(BaseHTTPMiddleware):
    """Adds CORS headers to every response. Handles OPTIONS preflight and ensures 401/403 have CORS."""
    async def dispatch(self, request: Request, call_next):
        # OPTIONS preflight: respond immediately with 204 + CORS so browser can then send GET
        if request.method == "OPTIONS" and _allow_origin(request.headers.get("origin") or ""):
            r = Response(status_code=204)
            _add_cors_headers(r, request)
            return r
        try:
            response = await call_next(request)
        except HTTPException as exc:
            response = JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
        _add_cors_headers(response, request)
        return response


app.add_middleware(CORSFixMiddleware)
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )
app.add_middleware(SecurityHeadersMiddleware)

@app.get("/")
@limiter.limit("5/minute")
async def root(request: Request):
    return {"message": "Welcome to FixedPrice Scotland API"}

@app.get("/health")
async def health_check():
    logger.debug("Health check called")
    return {"status": "healthy", "version": settings.VERSION}

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting FixedPrice Scotland API server...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
