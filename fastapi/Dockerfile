FROM python:3.11-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app
# Only copy the memory_api contents so we can install it
COPY memory_api/ /app/

RUN uv sync --frozen

EXPOSE 8765
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8765"]
