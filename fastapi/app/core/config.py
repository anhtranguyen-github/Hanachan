"""
Configuration — loads from .env in the project root.
"""

import os
from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator


# Resolve path to the .env that lives in the fastapi root
# Allow override via ENV_FILE environment variable for container deployments
_DEFAULT_ENV_PATH = Path(__file__).parent.parent.parent / ".env"
_ENV_FILE = Path(os.environ.get("ENV_FILE", _DEFAULT_ENV_PATH))


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE) if _ENV_FILE.exists() else None,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # OpenAI
    openai_api_key: str = ""
    llm_model: str = "gpt-4o"
    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 1536  # text-embedding-3-small dimension
    # ElevenLabs
    elevenlabs_api_key: str = ""

    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""
    supabase_jwt_secret: str = ""  # Required for JWT validation — no default

    # PostgreSQL (direct connection for memory modules)
    db_host: str = "127.0.0.1"
    db_port: int = 54422
    db_name: str = "postgres"
    db_user: str = "postgres"
    db_password: str = ""  # No default — must be set in env

    # Qdrant (cloud)
    qdrant_url: str = ""
    qdrant_api_key: str = ""
    qdrant_collection: str = "episodic_memory"

    # Neo4j (cloud)
    neo4j_uri: str = ""
    neo4j_user: str = ""
    neo4j_password: str = ""

    # CORS — explicit origin list, never wildcard with credentials
    allowed_origins: List[str] = ["http://localhost:3000"]

    # Trusted proxies for rate limiting (production deployment concern)
    # List of trusted proxy IPs. X-Forwarded-For is only trusted from these IPs.
    trusted_proxies: List[str] = []

    # Rate limiting
    rate_limit_per_minute: int = 20

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v: Optional[str | List[str]]) -> List[str]:
        """Parse allowed_origins from string or list."""
        if isinstance(v, str):
            import json

            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [v]
        return v or ["http://localhost:3000"]

    @field_validator("trusted_proxies", mode="before")
    @classmethod
    def parse_trusted_proxies(cls, v: Optional[str | List[str]]) -> List[str]:
        """Parse trusted_proxies from string or list."""
        if isinstance(v, str):
            import json

            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [p.strip() for p in v.split(",") if p.strip()]
        return v or []

    def validate_required(self) -> list[str]:
        """Return list of missing required configuration fields."""
        missing = []
        if not self.openai_api_key:
            missing.append("OPENAI_API_KEY")
        if not self.supabase_url:
            missing.append("SUPABASE_URL")
        if not self.supabase_key:
            missing.append("SUPABASE_KEY")
        if not self.db_password:
            missing.append("DB_PASSWORD")
        return missing


def validate_config() -> None:
    """Validate required config at startup. Raises ValueError if critical fields missing."""
    missing = settings.validate_required()
    if missing:
        raise ValueError(f"Missing required config: {', '.join(missing)}")


settings = Settings()
