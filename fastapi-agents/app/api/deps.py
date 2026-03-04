from typing import Any, Dict

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError
from app.core.config import settings

# HTTPBearer automatically looks for the Authorization header
security = HTTPBearer()

def get_current_user(token: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Validates the supplied JWT manually and returns the authenticated user context.
    The response contains the user's ID and the raw JWT for passing to downstream clients.
    """
    try:
        # NOTE: In a pure agent runtime, we verify the JWT locally or via a shared secret
        # Supabase JWTs are signed with the project's JWT secret
        payload = jwt.decode(
            token.credentials, 
            settings.supabase_service_key, # Usually Supabase JWT secret is the same as service key or provided separately
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: missing sub claim")
            
        return {
            "id": user_id,
            "email": payload.get("email"),
            "jwt": token.credentials,
        }
    except JWTError as e:
        # Provide generic error if token fails validation
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
