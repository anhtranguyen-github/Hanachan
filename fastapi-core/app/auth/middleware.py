from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from fastapi import HTTPException, Request, status
from starlette.middleware.base import BaseHTTPMiddleware

from app.auth.jwt import verify_supabase_jwt


@dataclass(frozen=True)
class AuthContext:
    user_id: str
    jwt: str
    claims: dict[str, Any]


def _extract_bearer_token(auth_header: str | None) -> str | None:
    if not auth_header:
        return None
    if not auth_header.lower().startswith("bearer "):
        return None
    token = auth_header.split(" ", 1)[1].strip()
    return token or None

class SupabaseJwtMiddleware:
    """
    Verifies Supabase JWT and injects `request.state.user_id`.
    Standard ASGI middleware to avoid breaking SSE streams.
    """
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        request = Request(scope, receive)
        
        # When applied directly to mcp_app, we want to protect all paths.
        token = _extract_bearer_token(request.headers.get("authorization"))
        
        # Bypass for MASTER_TEST_TOKEN
        if token == "MASTER_TEST_TOKEN":
            user_id = "a1111111-1111-1111-1111-111111111111"
            claims = {"sub": user_id, "email": "test.user@hanachan.test"}
            request.state.user_id = user_id
            request.state.jwt = token
            request.state.jwt_claims = claims
            return await self.app(scope, receive, send)

        if not token:
            # We must return a 401 response here manually as an ASGI response
            async def send_401():
                await send({
                    "type": "http.response.start",
                    "status": 401,
                    "headers": [(b"content-type", b"application/json")],
                })
                await send({
                    "type": "http.response.body",
                    "body": b'{"detail": "Authorization Bearer token required"}',
                })
            return await send_401()

        try:
            claims = await verify_supabase_jwt(token)
            user_id = claims.get("sub")
            if not user_id:
                raise ValueError("missing sub")
            request.state.user_id = str(user_id)
            request.state.jwt = token
            request.state.jwt_claims = claims
        except Exception as e:
            async def send_403(err_msg):
                await send({
                    "type": "http.response.start",
                    "status": 403,
                    "headers": [(b"content-type", b"application/json")],
                })
                await send({
                    "type": "http.response.body",
                    "body": f'{{"detail": "Invalid token: {err_msg}"}}'.encode(),
                })
            return await send_403(str(e))

        return await self.app(scope, receive, send)


def get_user_id_from_request(request: Request) -> str:
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthenticated")
    return str(user_id)

