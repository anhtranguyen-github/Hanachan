from typing import Any

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.jwt import verify_supabase_jwt

# HTTPBearer automatically looks for the Authorization header
security = HTTPBearer()


async def get_current_user(token: HTTPAuthorizationCredentials = Depends(security)) -> dict[str, Any]:
    """Verify Supabase JWT and return normalized user context."""
    try:
        payload = await verify_supabase_jwt(token.credentials)

        user_id = payload.get("sub")
        if not user_id and payload.get("role") == "service_role":
            user_id = "00000000-0000-0000-0000-000000000000"

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: missing sub claim")

        return {
            "id": user_id,
            "email": payload.get("email"),
            "jwt": token.credentials,
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
