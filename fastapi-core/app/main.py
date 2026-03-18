from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api.routes.learning import router as learning_router_v2
from app.api.routes.reading import router as reading_router_v2
from app.core.exceptions import CoreError, NotFoundError, UnauthorizedError, ValidationError
from app.adapters.http.chat import router as chat_router
from app.adapters.http.decks import router as decks_router
from app.adapters.http.learning import router as learning_router
from app.adapters.http.reading import router as reading_router
from app.adapters.http.sessions import router as sessions_router
from app.auth.middleware import SupabaseJwtMiddleware

app = FastAPI(
    title="Hanachan Core Service",
    description="Single Source of Truth for Hanachan Business Logic",
    version="0.1.0",
)

# Apply global authentication and context middleware
app.add_middleware(SupabaseJwtMiddleware)


@app.exception_handler(CoreError)
async def core_error_handler(request: Request, exc: CoreError):
    status_code = 400
    if isinstance(exc, NotFoundError):
        status_code = 404
    elif isinstance(exc, UnauthorizedError):
        status_code = 403
    elif isinstance(exc, ValidationError):
        status_code = 422
    
    return JSONResponse(
        status_code=status_code,
        content={"detail": str(exc)},
    )

import os

API_PREFIX = os.getenv("API_PREFIX", "/api/v1")

# Migrated Routes (V2)
app.include_router(learning_router_v2, prefix=API_PREFIX)
app.include_router(reading_router_v2, prefix=API_PREFIX)

# Legacy Routes (To be deprecated)
app.include_router(reading_router, prefix=API_PREFIX)
app.include_router(learning_router, prefix=API_PREFIX)
app.include_router(decks_router, prefix=API_PREFIX)
app.include_router(sessions_router, prefix=API_PREFIX)
app.include_router(chat_router, prefix=API_PREFIX)

# FastMCP tool gateway
from app.mcp.server import mcp
mcp_sse_app = mcp.sse_app()
# Middleware already applied globally to 'app', which includes mounted apps.
# But for absolute safety in sub-app routing, we can keep it or rely on parent.
app.mount("/mcp", mcp_sse_app)


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "fastapi-core"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=6200)
