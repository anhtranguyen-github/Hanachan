"""
Configuration — loads from the monorepo root .env by default.
"""

import os
from pathlib import Path

from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _resolve_env_file() -> Path | None:
    """Resolve the default env file, preferring the monorepo root."""
    explicit = os.environ.get("ENV_FILE")
    if explicit:
        return Path(explicit)

    fastapi_root = Path(__file__).resolve().parents[2]
    repo_root = Path(__file__).resolve().parents[4]

    repo_env = repo_root / ".env"
    if repo_env.exists():
        return repo_env

    fastapi_env = fastapi_root / ".env"
    if fastapi_env.exists():
        return fastapi_env

    return None


_ENV_FILE = _resolve_env_file()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE) if _ENV_FILE else None,
        env_file_encoding="utf-8",
        extra="ignore",
        env_prefix="",
    )

    # LLM (OmniRoute / Private)
    llm_api_key: str = Field("", alias="LLM_API_KEY")
    llm_api_base: str | None = None
    llm_model: str = "free-combo"
    default_llm_model: str = "free-combo"
    llm_base_url: str = "http://localhost:43120/v1"
    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 1024  # jina-embeddings-v3 default dimension
    
    # Jina AI
    jina_api_key: str = Field("", alias="JINA_API_KEY")
    jina_embedding_model: str = "jina-embeddings-v3"
    # ElevenLabs
    elevenlabs_api_key: str = ""

    # Supabase (required for all database access)
    supabase_url: str = ""
    supabase_key: str = ""
    supabase_service_key: str = Field(
        "",
        validation_alias=AliasChoices("SUPABASE_SERVICE_KEY", "SUPABASE_SERVICE_ROLE_KEY"),
    )
    supabase_jwt_secret: str = ""

    # Qdrant (cloud)
    qdrant_url: str = ""
    qdrant_api_key: str = ""
    qdrant_collection: str = "episodic_memory"

    # Neo4j (cloud)
    neo4j_uri: str = Field("", alias="NEO4J_URI")
    neo4j_user: str = Field("", alias="NEO4J_USER")
    neo4j_password: str = Field("", alias="NEO4J_PASSWORD")
    neo4j_database: str = Field("neo4j", alias="NEO4J_DATABASE")
    aura_instanceid: str = Field("", alias="AURA_INSTANCEID")
    aura_instancename: str = Field("", alias="AURA_INSTANCENAME")

    # CORS — explicit origin list, never wildcard with credentials
    allowed_origins: list[str] = ["http" + "://localhost:43100"]

    # Trusted proxies for rate limiting (production deployment concern)
    # List of trusted proxy IPs. X-Forwarded-For is only trusted from these IPs.
    trusted_proxies: list[str] = []

    # Rate limiting
    rate_limit_per_minute: int = 20

    # Environment
    environment: str = "development"
    allow_master_token: bool = False

    # Database (direct Postgres for read-only SQL)
    database_url: str = ""

    # Deprecated compatibility fields from the two-service split
    fastapi_core_url: str = "http://localhost:43110/api/v1"
    fastapi_core_mcp_url: str = "http://localhost:43110/mcp/sse"

    admin_emails: list[str] = ["admin@hanachan.test"]


    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v: str | list[str] | None) -> list[str]:
        """Parse allowed_origins from string or list."""
        if isinstance(v, str):
            import json

            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [v]
        return v or ["http" + "://localhost:43100"]

    @field_validator("trusted_proxies", mode="before")
    @classmethod
    def parse_trusted_proxies(cls, v: str | list[str] | None) -> list[str]:
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
        if not self.llm_api_key:
            missing.append("LLM_API_KEY")
        if not self.supabase_url:
            missing.append("SUPABASE_URL")
        if not self.supabase_key:
            missing.append("SUPABASE_KEY")
        if not self.jina_api_key and not self.llm_api_key:
            missing.append("JINA_API_KEY or LLM_API_KEY")
        return missing


def validate_config() -> None:
    """Validate required config at startup. Raises ValueError if critical fields missing."""
    missing = settings.validate_required()
    if missing:
        raise ValueError(f"Missing required config: {', '.join(missing)}")


settings = Settings()
