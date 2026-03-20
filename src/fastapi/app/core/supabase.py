"""Centralized Supabase client — single point of creation for the entire service."""

from functools import lru_cache

from supabase import Client, create_client

from app.core.config import settings


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    """Return a long-lived Supabase admin client (service-key)."""
    return create_client(settings.supabase_url, settings.supabase_service_key)
