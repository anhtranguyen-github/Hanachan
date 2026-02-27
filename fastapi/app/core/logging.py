"""
Structured JSON logging with request-ID propagation.
"""
from __future__ import annotations

import json
import logging
import uuid
from contextvars import ContextVar

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

# Context variable so every log record in a request carries the same ID
request_id_var: ContextVar[str] = ContextVar("request_id", default="")

# Fields that are part of the standard LogRecord and should not be duplicated
_STANDARD_FIELDS = frozenset(
    {
        "message", "msg", "args", "levelname", "name", "pathname", "filename",
        "module", "exc_info", "exc_text", "stack_info", "lineno", "funcName",
        "created", "msecs", "relativeCreated", "thread", "threadName",
        "processName", "process", "taskName",
    }
)


class StructuredFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log: dict = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": request_id_var.get(""),
        }
        # Attach any extra= kwargs passed to the logger call
        extras = {
            k: v
            for k, v in record.__dict__.items()
            if k not in _STANDARD_FIELDS
            and not k.startswith("_")
            and k not in log
        }
        log.update(extras)
        if record.exc_info:
            log["exception"] = self.formatException(record.exc_info)
        return json.dumps(log, default=str)


def configure_logging() -> None:
    """Replace the root handler with a structured JSON handler."""
    handler = logging.StreamHandler()
    handler.setFormatter(StructuredFormatter())
    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(logging.INFO)


class RequestIdMiddleware(BaseHTTPMiddleware):
    """Attach a request ID to every request and propagate it in the response."""

    async def dispatch(self, request: Request, call_next):
        rid = request.headers.get("X-Request-ID") or str(uuid.uuid4())[:8]
        token = request_id_var.set(rid)
        try:
            response = await call_next(request)
        finally:
            request_id_var.reset(token)
        response.headers["X-Request-ID"] = rid
        return response
