from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List, Union
import os


class Settings(BaseSettings):
    PROJECT_NAME: str = "FixedPrice Scotland API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Supabase configuration
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""  # JWT secret for HS256 validation (from Project Settings → API)
    SUPABASE_DB_PASSWORD: str
    
    # Database connection (Postgres)
    DB_HOST: str
    DB_PORT: int = 5432
    DB_USER: str = "postgres"
    DB_NAME: str = "postgres"
    
    # SSL Certificate for database connections
    DB_SSL_CERT_PATH: str = "backend/certs/prod-ca-2021.crt"
    DB_SSL_MODE: str = "require"  # Options: disable, allow, prefer, require, verify-ca, verify-full
    
    # OpenAI
    OPENAI_API_KEY: str
    
    # Stripe (optional for now)
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    
    # Security
    JWT_SECRET: str  # Required, no default - must be set in .env
    ALGORITHM: str = "HS256"
    
    # CORS (env: comma-separated string or JSON array)
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000,http://0.0.0.0:8000"
    # Set to True to allow wildcard localhost in development only
    CORS_ALLOW_LOCALHOST_WILDCARD: bool = True

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            return [x.strip() for x in v.split(",") if x.strip()]
        return []

    # Email Settings
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = ""
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_FROM_NAME: str = "FixedPrice Scotland"
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False
    USE_CREDENTIALS: bool = True
    VALIDATE_CERTS: bool = True
    
    # Zoopla API (requires commercial agreement with Hometrack)
    ZOOPLA_CLIENT_ID: str = ""
    ZOOPLA_CLIENT_SECRET: str = ""
    ZOOPLA_AUDIENCE: str = "https://services.zoopla.co.uk"
    ZOOPLA_BASE_URL: str = "https://services.zoopla.co.uk"
    ZOOPLA_AUTH_URL: str = "https://services-auth.services.zoopla.co.uk/oauth2/token"
    ZOOPLA_ENABLED: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
    )


# Required fields are loaded from env by BaseSettings; no constructor args needed
settings: Settings = Settings()  # type: ignore[call-arg]
