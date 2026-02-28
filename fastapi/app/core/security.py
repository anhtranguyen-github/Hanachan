"""
JWT Authentication — validates Supabase-issued tokens.
Uses RS256 (asymmetric) for token verification.
"""

from __future__ import annotations

import logging
from typing import Optional

import jwt  # PyJWT
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jwt import PyJWKClient, PyJWKClientError

from .config import settings

logger = logging.getLogger(__name__)

_bearer = HTTPBearer()

# Cache for JWKS client to avoid refetching keys on every request
_jwks_client: Optional[PyJWKClient] = None

# RS256 only - HS256 fallback removed for security


def _get_jwks_client() -> PyJWKClient:
    """Get or create a cached JWKS client for token verification."""
    global _jwks_client
    if _jwks_client is None:
        # Supabase JWKS endpoint
        jwks_url = f"{settings.supabase_url}/auth/v1/jwks"
        _jwks_client = PyJWKClient(jwks_url, cache_keys=True)
    return _jwks_client


def _decode_token_rs256(credentials: str) -> dict:
    """Decode using RS256 (asymmetric with JWKS)."""
    jwks_client = _get_jwks_client()
    signing_key = jwks_client.get_signing_key_from_jwt(credentials)
    return jwt.decode(
        credentials,
        signing_key.key,
        algorithms=["RS256"],
        audience="authenticated",
    )


def require_auth(
    creds: HTTPAuthorizationCredentials = Security(_bearer),
) -> dict:
    """Validate the Bearer JWT and return the decoded payload.

    Uses RS256 (asymmetric) with JWKS for token verification.
    """
    token = creds.credentials

    # 1. Allow Service Role Key (Server-to-Server)
    # MUST be a dedicated secret, not the public anon 'supabase_key'.
    if settings.supabase_service_key and token == settings.supabase_service_key:
        return {"sub": "service_role", "role": "service_role"}

    # 2. RS256 (User JWT)
    try:
        return _decode_token_rs256(token)
    except PyJWKClientError as e:
        # JWKS endpoint unavailable - fail hard, no fallback
        logger.error("rs256_jwks_unavailable", extra={"error": str(e)})
        raise HTTPException(status_code=401, detail="Token verification unavailable")
    except jwt.InvalidSignatureError:
        logger.warning(
            "rs256_signature_invalid",
            extra={"token_prefix": token[:20] if token else ""},
        )
        raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.ExpiredSignatureError:
        logger.warning(
            "rs256_token_expired", extra={"token_prefix": token[:20] if token else ""}
        )
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        logger.warning("rs256_invalid_token", extra={"error": str(e)})
        raise HTTPException(status_code=401, detail="Invalid token")


def require_own_user(
    user_id: str,
    payload: dict = Depends(require_auth),
) -> str:
    """Ensures the authenticated user can only touch their own data.
    Allows 'service_role' to bypass this check.
    """
    if payload.get("role") != "service_role" and payload.get("sub") != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return user_id
