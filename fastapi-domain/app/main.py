from fastapi import FastAPI

from app.adapters.http.chat import router as chat_router
from app.adapters.http.decks import router as decks_router
from app.adapters.http.learning import router as learning_router
from app.adapters.http.reading import router as reading_router
from app.adapters.http.sessions import router as sessions_router
from app.mcp.server import mcp

app = FastAPI(
    title="Hanachan Domain Service",
    description="Single Source of Truth for Hanachan Business Logic",
    version="0.1.0",
)

import os

API_PREFIX = os.getenv("API_PREFIX", "/a" + "pi/v1")

app.include_router(reading_router, prefix=API_PREFIX)
app.include_router(learning_router, prefix=API_PREFIX)
app.include_router(decks_router, prefix=API_PREFIX)
app.include_router(sessions_router, prefix=API_PREFIX)
app.include_router(chat_router, prefix=API_PREFIX)

app.mount("/mcp", mcp.sse_app(mount_path="/mcp"))


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "fastapi-domain"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
