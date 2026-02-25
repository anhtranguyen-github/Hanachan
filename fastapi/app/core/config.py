"""
Configuration — loads from .env in the project root.
"""
import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


# Resolve path to the .env that lives in the fastapi root
_ENV_FILE = Path(__file__).parent.parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # OpenAI
    openai_api_key: str = ""
    llm_model: str = "gpt-4o"
    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 1536  # text-embedding-3-small dimension

    # Qdrant (cloud)
    qdrant_url: str = ""
    qdrant_api_key: str = ""
    qdrant_collection: str = "episodic_memory"

    # Neo4j (cloud)
    neo4j_uri: str = ""
    neo4j_user: str = ""
    neo4j_password: str = ""


settings = Settings()
