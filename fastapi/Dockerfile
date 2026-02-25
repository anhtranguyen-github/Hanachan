FROM python:3.11-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app
# Copy the new modular app and configuration
COPY . /app/

RUN uv sync --frozen

EXPOSE 8765
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8765"]
