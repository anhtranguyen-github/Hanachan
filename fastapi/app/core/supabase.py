
from supabase import create_client, Client
from app.core.config import settings

def get_supabase() -> Client:
    """Return a Supabase client using service role key (for server-side bypass)."""
    return create_client(settings.supabase_url, settings.supabase_service_key)

supabase: Client = get_supabase()
