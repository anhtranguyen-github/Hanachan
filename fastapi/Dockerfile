# ─── FastAPI — Multi-stage Dockerfile ────────────────────────────────────────
# Stages:
#   base    — Python + uv setup
#   deps    — install production dependencies
#   test    — install test dependencies + run pytest
#   runner  — production image (default)
# ─────────────────────────────────────────────────────────────────────────────

FROM python:3.11-slim AS base
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app
COPY . /app/

# ── Production dependencies ──────────────────────────────────────────────────
FROM base AS deps
RUN uv sync --frozen

# ── Test stage ───────────────────────────────────────────────────────────────
FROM deps AS test
RUN uv pip install pytest pytest-asyncio httpx pytest-cov
CMD ["uv", "run", "pytest", "tests/", "-v", "--tb=short", "--cov=app", "--cov-report=term-missing"]

# ── Production runner ────────────────────────────────────────────────────────
FROM deps AS runner
EXPOSE 8765
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8765"]
