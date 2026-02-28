"""
Rate limiting — slowapi per-IP limiter with trusted proxy support.

Security: X-Forwarded-For is only trusted if the client IP is in TRUSTED_PROXIES.
"""

from __future__ import annotations

import logging
from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from .config import settings

logger = logging.getLogger(__name__)

# Trusted proxy IPs - only trust X-Forwarded-For from these IPs
_TRUSTED_PROXIES: list[str] = settings.trusted_proxies or []


def _is_trusted_proxy(request: Request) -> bool:
    """Check if the request originates from a trusted proxy.

    Only trust X-Forwarded-For if the direct client IP is in the TRUSTED_PROXIES list.
    """
    if not _TRUSTED_PROXIES:
        return False

    # Check direct remote address against trusted proxies
    client_host = request.client.host if request.client else None
    if client_host in _TRUSTED_PROXIES:
        return True
    return False


def get_real_ip(request: Request) -> str:
    """Extract real client IP from request with trusted proxy check.

    Only trust X-Forwarded-For if request comes from a trusted proxy (TRUSTED_PROXIES).
    """
    if _is_trusted_proxy(request):
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            # X-Forwarded-For can contain multiple IPs, take the first (original client)
            return forwarded.split(",")[0].strip()

    # Fall back to direct client IP
    return get_remote_address(request)


limiter = Limiter(key_func=get_real_ip)


def rate_limit_exceeded_handler(
    request: Request, exc: RateLimitExceeded
) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={"detail": f"Rate limit exceeded: {exc.detail}"},
        headers={"Retry-After": "60"},
    )
