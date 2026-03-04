import os

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

security = HTTPBearer()

# In a real app, these would be in a config file loaded from env
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
SUPABASE_ALGORITHM = "HS256"


async def get_current_user_id(res: HTTPAuthorizationCredentials = Depends(security)) -> str:
    token = res.credentials
    try:
        # NOTE: In production, we'd verify the signature with SUPABASE_JWT_SECRET
        # For this scaffold, we extract the 'sub' claim which is the user_id
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=[SUPABASE_ALGORITHM],
            options={"verify_aud": False},
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing sub claim",
            )
        return user_id
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
        )
