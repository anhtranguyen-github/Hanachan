"""
Error handling — safe public messages, no internal detail leakage.
"""

from __future__ import annotations

import logging
import uuid

from fastapi import Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


class AppError(Exception):
    """Base for all application errors with a safe public message."""

    def __init__(self, public_msg: str, status_code: int = 500, **log_context):
        self.public_msg = public_msg
        self.status_code = status_code
        self.log_context = log_context
        super().__init__(public_msg)


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    error_id = str(uuid.uuid4())[:12]  # Use 12 chars for better collision resistance
    logger.error(
        "app_error",
        extra={
            "error_id": error_id,
            "path": request.url.path,
            "method": request.method,
            "error": exc.public_msg,
            **exc.log_context,
        },
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.public_msg, "error_id": error_id},
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all handler — logs full details, returns opaque error_id to client."""
    error_id = str(uuid.uuid4())[:12]  # Use 12 chars for better collision resistance
    logger.error(
        "unhandled_exception",
        extra={
            "error_id": error_id,
            "path": request.url.path,
            "method": request.method,
            "error": str(exc),
            "type": type(exc).__name__,
        },
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error_id": error_id},
    )
