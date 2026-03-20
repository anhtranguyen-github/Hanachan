"""JWT middleware — verifies Supabase JWT and injects request.state.user_id.

Standard ASGI middleware (not BaseHTTPMiddleware) to avoid breaking SSE streams.
"""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException, Request, status

from app.auth.context import set_current_user_id
from app.auth.jwt import verify_supabase_jwt


def _extract_bearer_token(auth_header: str | None) -> str | None:
    if not auth_header:
        return None
    if not auth_header.lower().startswith("bearer "):
        return None
    token = auth_header.split(" ", 1)[1].strip()
    return token or None


class JwtAuthMiddleware:
    """ASGI middleware that verifies Supabase JWT on every request."""

    def __init__(self, app: Any):
        self.app = app

    async def __call__(self, scope: dict, receive: Any, send: Any) -> None:
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        request = Request(scope, receive)
        path = scope.get("path", "")

        # Public paths bypass
        if path in ["/health", "/docs", "/openapi.json"]:
            return await self.app(scope, receive, send)

        token = _extract_bearer_token(request.headers.get("authorization"))

        # Dev-only master test token bypass
        from app.core.config import settings

        if (
            token == "MASTER_TEST_TOKEN"
            and settings.environment == "development"
            and settings.allow_master_token
        ):
            user_id = "a1111111-1111-1111-1111-111111111111"
            request.state.user_id = user_id
            request.state.jwt = token
            request.state.jwt_claims = {"sub": user_id, "email": "test.user@hanachan.test"}
            set_current_user_id(user_id)
            return await self.app(scope, receive, send)

        if not token:

            async def send_401() -> None:
                await send(
                    {
                        "type": "http.response.start",
                        "status": 401,
                        "headers": [(b"content-type", b"application/json")],
                    }
                )
                await send(
                    {
                        "type": "http.response.body",
                        "body": b'{"detail": "Authorization Bearer token required"}',
                    }
                )

            return await send_401()

        try:
            claims = await verify_supabase_jwt(token)
            user_id = claims.get("sub")
            if not user_id:
                raise ValueError("missing sub")
            request.state.user_id = str(user_id)
            request.state.jwt = token
            request.state.jwt_claims = claims
            set_current_user_id(str(user_id))
        except Exception as e:

            async def send_403(err_msg: str) -> None:
                await send(
                    {
                        "type": "http.response.start",
                        "status": 403,
                        "headers": [(b"content-type", b"application/json")],
                    }
                )
                await send(
                    {
                        "type": "http.response.body",
                        "body": f'{{"detail": "Invalid token: {err_msg}"}}'.encode(),
                    }
                )

            return await send_403(str(e))

        return await self.app(scope, receive, send)
