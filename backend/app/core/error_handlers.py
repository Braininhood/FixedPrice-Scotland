"""
Centralized error handling utilities for consistent API responses.
"""

from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from app.core.logging_config import get_logger

logger = get_logger(__name__)


class APIError(Exception):
    """Base exception for API errors."""
    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class ValidationAPIError(APIError):
    """Validation error with 422 status."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status.HTTP_422_UNPROCESSABLE_ENTITY, details)


class AuthenticationError(APIError):
    """Authentication error with 401 status."""
    def __init__(self, message: str = "Not authenticated"):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED)


class AuthorizationError(APIError):
    """Authorization error with 403 status."""
    def __init__(self, message: str = "Not authorized"):
        super().__init__(message, status.HTTP_403_FORBIDDEN)


class NotFoundError(APIError):
    """Resource not found error with 404 status."""
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status.HTTP_404_NOT_FOUND)


class ConflictError(APIError):
    """Conflict error with 409 status."""
    def __init__(self, message: str = "Resource conflict"):
        super().__init__(message, status.HTTP_409_CONFLICT)


class RateLimitError(APIError):
    """Rate limit error with 429 status."""
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(message, status.HTTP_429_TOO_MANY_REQUESTS)


def handle_validation_error(exc: ValidationError) -> JSONResponse:
    """
    Convert Pydantic validation errors to standardized API response.
    """
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })
    
    logger.warning(f"Validation error: {errors}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation error",
            "errors": errors
        }
    )


def handle_api_error(exc: APIError) -> JSONResponse:
    """
    Convert APIError to standardized JSON response.
    """
    logger.error(f"API Error: {exc.message} (status: {exc.status_code})")
    
    content = {
        "detail": exc.message
    }
    
    if exc.details:
        content["details"] = exc.details
    
    return JSONResponse(
        status_code=exc.status_code,
        content=content
    )


def handle_generic_error(exc: Exception) -> JSONResponse:
    """
    Handle unexpected exceptions with generic 500 error.
    """
    logger.exception(f"Unexpected error: {str(exc)}")
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Internal server error"
        }
    )
