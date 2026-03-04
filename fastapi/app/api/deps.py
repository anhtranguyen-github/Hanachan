from typing import Any, Dict

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client, ClientOptions, create_client

from app.core.config import settings

# HTTPBearer automatically looks for the Authorization header
security = HTTPBearer()

def get_supabase_client(jwt: str) -> Client:
    """
    Creates a user-scoped Supabase client that uses the ANON key
    and injects the user's JWT. This ensures all database operations
    respect Row Level Security (RLS) policies.
    """
    options = ClientOptions(headers={"Authorization": f"Bearer {jwt}"})
    return create_client(settings.supabase_url, settings.supabase_key, options=options)

def get_current_user(token: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Validates the supplied JWT with Supabase Auth and returns the authenticated user context.
    The response contains the user's ID and the raw JWT for passing to downstream clients.
    """
    try:
        # We use a standalone anon client purely to verify the token via Supabase Auth
        auth_client = create_client(settings.supabase_url, settings.supabase_key)
        user_response = auth_client.auth.get_user(token.credentials)
        if not user_response or not getattr(user_response, "user", None):
            raise HTTPException(status_code=401, detail="Invalid authentication token")
            
        return {
            "id": user_response.user.id,
            "email": getattr(user_response.user, "email", None),
            "jwt": token.credentials,
        }
    except Exception as e:
        # Provide generic error if token fails validation
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

def get_user_client(current_user: Dict[str, Any] = Depends(get_current_user)) -> Client:
    """
    FastAPI Dependency that yields a Supabase client acting on behalf of the current user.
    Usage:
        def my_endpoint(client: Client = Depends(get_user_client)):
            client.table("...").select(...)
    """
    return get_supabase_client(current_user["jwt"])
