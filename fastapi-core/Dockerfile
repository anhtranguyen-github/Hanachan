FROM python:3.11-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Create a non-privileged user and set up workspace
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -s /bin/sh -m appuser

WORKDIR /app

# ── Dependency stage ──────────────────────────────────────────────────────────
FROM base AS deps
# Copy only files needed for installing dependencies
COPY pyproject.toml uv.lock ./
# Sync dependencies only
RUN uv sync --frozen --no-install-project

# ── Test stage ───────────────────────────────────────────────────────────────
FROM deps AS test
RUN uv pip install pytest pytest-asyncio httpx pytest-cov
USER appuser
CMD ["uv", "run", "pytest", "tests/", "-v", "--tb=short", "--cov=app", "--cov-report=term-missing"]

# ── Production runner ────────────────────────────────────────────────────────
FROM deps AS runner
COPY --chown=appuser:appgroup . .
RUN uv sync

USER appuser
EXPOSE 6200
# Use a healthcheck for better reliability
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:6200/openapi.json')"]

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "6200"]
