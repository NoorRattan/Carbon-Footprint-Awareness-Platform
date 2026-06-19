"""Application configuration using pydantic-settings.

Reads all configuration from environment variables with type validation.
Use get_settings() everywhere — it is cached after the first call.
"""

import logging
from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Application settings loaded from environment variables.

    All fields have defaults suitable for development. Production values
    are injected via Cloud Run environment variable configuration.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Google Cloud / Firebase
    google_cloud_project: str = "ecotrack-app-2026"
    firebase_service_account_key: str = "serviceAccountKey.json"

    # Application
    environment: str = "development"
    secret_key: str = "dev-secret-key-replace-in-production"

    # CORS — comma-separated list
    allowed_origins: str = "http://localhost:5173"

    # Rate limiting
    rate_limit_per_minute: int = 60

    @field_validator("environment")
    @classmethod
    def validate_environment(cls, v: str) -> str:
        """Validate environment is one of the allowed values.

        Args:
            v: Raw environment string value.

        Returns:
            Lowercase validated environment string.

        Raises:
            ValueError: If environment is not 'development', 'production', or 'test'.
        """
        allowed = {"development", "production", "test"}
        if v.lower() not in allowed:
            raise ValueError(f"environment must be one of {allowed}, got '{v}'")
        return v.lower()

    @field_validator("rate_limit_per_minute")
    @classmethod
    def validate_rate_limit(cls, v: int) -> int:
        """Validate rate limit is a positive integer.

        Args:
            v: Rate limit value.

        Returns:
            Validated rate limit integer.

        Raises:
            ValueError: If rate limit is not positive.
        """
        if v <= 0:
            raise ValueError("rate_limit_per_minute must be a positive integer")
        return v


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings singleton.

    The settings object is created once and reused for the lifetime of the
    application. Use this function everywhere instead of instantiating
    Settings() directly.

    Returns:
        Cached Settings instance populated from environment variables.
    """
    settings = Settings()
    logger.info(
        "Settings loaded: environment=%s, project=%s",
        settings.environment,
        settings.google_cloud_project,
    )
    return settings
