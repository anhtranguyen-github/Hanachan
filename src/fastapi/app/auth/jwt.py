"""JWT verification using Supabase JWKS with PyJWT."""

import time
from typing import Any

import httpx
import jwt
from fastapi import HTTPException, status
from jwt import InvalidTokenError, PyJWKClient

from app.core.config import settings

_JWKS_CACHE: dict[str, Any] = {"fetched_at": 0.0, "jwks": None}
_JWKS_TTL_SECONDS = 10 * 60


async def _get_jwks() -> dict[str, Any]:
    if not settings.supabase_url:
        raise HTTPException(status_code=500, detail="SUPABASE_URL is not configured")

    now = time.time()
    cached = _JWKS_CACHE.get("jwks")
    fetched_at = float(_JWKS_CACHE.get("fetched_at") or 0.0)
    if cached and (now - fetched_at) < _JWKS_TTL_SECONDS:
        return cached

    url = f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        jwks_data = resp.json()

    _JWKS_CACHE["jwks"] = jwks_data
    _JWKS_CACHE["fetched_at"] = now
    return jwks_data


def _decode_hs256(token: str) -> dict[str, Any] | None:
    for secret in [settings.supabase_jwt_secret, settings.supabase_service_key]:
        if not secret:
            continue
        try:
            return jwt.decode(token, secret, algorithms=["HS256"], options={"verify_aud": False})
        except InvalidTokenError:
            continue
    return None


async def verify_supabase_jwt(token: str) -> dict[str, Any]:
    """Verify a Supabase JWT using JWKS or HS256 fallback."""
    hs256_payload = _decode_hs256(token)
    if hs256_payload:
        if not hs256_payload.get("sub") and hs256_payload.get("role") == "service_role":
            hs256_payload["sub"] = "a1111111-1111-1111-1111-111111111111"
        return hs256_payload

    if not settings.supabase_url:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="SUPABASE_URL is not configured")

    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg")
        if not alg:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token header")

        await _get_jwks()
        jwks_client = PyJWKClient(
            f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
        )
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=[alg],
            options={"verify_aud": False},
        )
    except HTTPException:
        raise
    except InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e!s}",
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
