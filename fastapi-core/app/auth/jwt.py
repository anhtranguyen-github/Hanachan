import os
import time
from typing import Any

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwk, jwt

security = HTTPBearer()

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")

_JWKS_CACHE: dict[str, Any] = {"fetched_at": 0.0, "jwks": None}
_JWKS_TTL_SECONDS = 10 * 60


async def _get_jwks() -> dict[str, Any]:
    if not SUPABASE_URL:
        raise HTTPException(status_code=500, detail="SUPABASE_URL is not configured")

    now = time.time()
    cached = _JWKS_CACHE.get("jwks")
    fetched_at = float(_JWKS_CACHE.get("fetched_at") or 0.0)
    if cached and (now - fetched_at) < _JWKS_TTL_SECONDS:
        return cached

    url = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        jwks = resp.json()

    _JWKS_CACHE["jwks"] = jwks
    _JWKS_CACHE["fetched_at"] = now
    return jwks


async def verify_supabase_jwt(token: str) -> dict[str, Any]:
    from app.core.config import settings
    # Trusted tokens bypass (for simulation/integration tests)
    if token in [settings.SUPABASE_JWT_SECRET, settings.SUPABASE_SERVICE_KEY]:
        try:
            claims = jwt.get_unverified_claims(token)
            if not claims.get("sub") and claims.get("role") == "service_role":
                claims["sub"] = "00000000-0000-0000-0000-000000000000"
            return claims
        except Exception:
            pass

    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        alg = header.get("alg")
        if not kid or not alg:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token header")

        jwks = await _get_jwks()
        keys = jwks.get("keys") or []
        key_dict = next((k for k in keys if k.get("kid") == kid), None)
        
        if not key_dict and alg == "HS256":
            # Fallback for HS256 (common in dev or service-to-service)
            from app.core.config import settings
            # We try common secret sources
            for secret in [settings.SUPABASE_JWT_SECRET, settings.SUPABASE_SERVICE_KEY]:
                try:
                    return jwt.decode(
                        token,
                        secret,
                        algorithms=["HS256"],
                        options={"verify_aud": False},
                    )
                except Exception:
                    continue
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid HS256 token")

        if not key_dict:
            # JWKS rotated, refresh once.
            _JWKS_CACHE["jwks"] = None
            jwks = await _get_jwks()
            keys = jwks.get("keys") or []
            key_dict = next((k for k in keys if k.get("kid") == kid), None)
        if not key_dict:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unknown signing key")

        key = jwk.construct(key_dict)
        public_key_pem = key.to_pem().decode("utf-8")
        return jwt.decode(
            token,
            public_key_pem,
            algorithms=[alg],
            options={"verify_aud": False},
        )
    except HTTPException:
        raise
    except JWTError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {str(e)}")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


async def get_current_user_id(res: HTTPAuthorizationCredentials = Depends(security)) -> str:
    payload = await verify_supabase_jwt(res.credentials)
    user_id: str | None = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token: missing sub claim")
    return str(user_id)
