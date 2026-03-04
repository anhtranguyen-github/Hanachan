from supabase import create_client, Client
from app.core.config import settings

def get_service_client() -> Client:
    """
    Return a Supabase client using the SERVICE ROLE key.
    
    WARNING: This bypasses Row Level Security (RLS). Use ONLY for:
    - Background jobs
    - Migrations
    - Admin-only maintenance scripts
    
    NEVER use this in user-facing endpoints. Rely on `get_user_client` 
    from `app.api.deps` instead.
    """
    return create_client(settings.supabase_url, settings.supabase_service_key)
