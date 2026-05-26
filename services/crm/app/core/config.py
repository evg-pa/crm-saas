"""Application configuration via environment variables.

Uses pydantic-settings for typed, validated configuration.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = "CRM Backend"
    app_version: str = "0.1.0"
    debug: bool = False

    # Database
    database_url: str = (
        "postgresql+asyncpg://crm_user:crm_pass@localhost:5432/crm_db"
    )
    database_url_sync: str = (
        "postgresql+psycopg2://crm_user:crm_pass@localhost:5432/crm_db"
    )

    # JWT
    jwt_secret_key: str = "development-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # CORS
    cors_origins: list[str] = ["*"]

    # Logging
    log_format: str = "text"  # "text" or "json"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000


settings = Settings()
