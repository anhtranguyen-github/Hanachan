import base64
import json
from typing import Any

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

# HTTPBearer automatically looks for the Authorization header
security = HTTPBearer()


def get_current_user(token: HTTPAuthorizationCredentials = Depends(security)) -> dict[str, Any]:
    """
    Extracts user context from the supplied JWT without performing cryptographic validation.
    This complies with the architecture rule: JWT validation is forbidden in FastAPI (handled by Domain SSOT).
    The response contains the user's ID and the raw JWT for passing to downstream clients.
    """
    try:
        # JWT is [header].[payload].[signature] - we only need the payload
        parts = token.credentials.split(".")
        if len(parts) < 2:
            raise HTTPException(status_code=401, detail="Invalid token format")

        payload_b64 = parts[1]
        # Add padding back for base64 decoding
        missing_padding = len(payload_b64) % 4
        if missing_padding:
            payload_b64 += "=" * (4 - missing_padding)

        payload_json = base64.urlsafe_b64decode(payload_b64).decode("utf-8")
        payload = json.loads(payload_json)

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: missing sub claim")

        return {
            "id": user_id,
            "email": payload.get("email"),
            "jwt": token.credentials,
        }
    except Exception as e:
        # Provide generic error if token extraction fails
        raise HTTPException(status_code=401, detail=f"Authentication extraction failed: {str(e)}")
