#!/usr/bin/env bash
set -Eeuo pipefail

########################################
# Hanachan Startup Script (Overhauled)
########################################

FRONTEND_PORT=3000
BACKEND_PORT=8765
MODE="${1:-dev}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

BACKEND_PID=""
FRONTEND_PID=""

########################################
# Logging helpers
########################################
log() {
  echo -e "[$(date +'%H:%M:%S')] $*"
}

########################################
# Port cleanup
########################################
cleanup_port() {
  local port="$1"
  log "Ensuring port $port is free..."

  if command -v fuser >/dev/null 2>&1; then
    fuser -k "$port/tcp" >/dev/null 2>&1 || true
  fi

  if command -v lsof >/dev/null 2>&1; then
    local pids
    pids="$(lsof -ti :"$port" || true)"
    if [[ -n "$pids" ]]; then
      log "Killing remaining PIDs on port $port: $pids"
      kill -9 $pids 2>/dev/null || true
    fi
  fi

  sleep 1
}

########################################
# Graceful shutdown
########################################
shutdown() {
  log "Stopping services..."

  if [[ -n "$FRONTEND_PID" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    log "Stopping frontend (PID $FRONTEND_PID)"
    kill -TERM "$FRONTEND_PID" 2>/dev/null || true
  fi

  if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    log "Stopping backend (PID $BACKEND_PID)"
    kill -TERM "$BACKEND_PID" 2>/dev/null || true
  fi

  # Give processes time to exit gracefully
  sleep 2

  # Hard kill if still alive
  if [[ -n "$FRONTEND_PID" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    log "Force killing frontend"
    kill -KILL "$FRONTEND_PID" 2>/dev/null || true
  fi

  if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    log "Force killing backend"
    kill -KILL "$BACKEND_PID" 2>/dev/null || true
  fi

  wait || true
  log "Shutdown complete."
  exit 0
}

trap shutdown SIGINT SIGTERM

########################################
# Startup
########################################
log "☁️ Using Cloud Supabase"
log "🧹 Cleaning ports"

cleanup_port "$BACKEND_PORT"
cleanup_port "$FRONTEND_PORT"

########################################
# Backend
########################################
log "🚀 Starting backend on port $BACKEND_PORT"
cd "$ROOT_DIR/fastapi"

uv run python -m uvicorn app.main:app \
  --host 0.0.0.0 \
  --port "$BACKEND_PORT" \
  > "$ROOT_DIR/fastapi/server.log" 2>&1 &

BACKEND_PID=$!

log "⏳ Waiting for backend health..."
for i in {1..10}; do
  if curl -sf "http://localhost:$BACKEND_PORT/api/v1/health" >/dev/null; then
    log "✅ Backend ready"
    break
  fi
  sleep 1
done

########################################
# Frontend
########################################
cd "$ROOT_DIR/nextjs"

case "$MODE" in
  prod|product)
    log "🏗️ Building frontend (production)"
    pnpm run build
    log "🚀 Starting frontend (production)"
    PORT="$FRONTEND_PORT" pnpm run start &
    ;;
  build)
    log "🏗️ Build-only mode"
    pnpm run build
    shutdown
    ;;
  *)
    log "🚀 Starting frontend (dev)"
    PORT="$FRONTEND_PORT" pnpm run dev &
    ;;
esac

FRONTEND_PID=$!

########################################
# Final status
########################################
log "✅ Startup complete"
log "Backend:  http://localhost:$BACKEND_PORT"
log "Frontend: http://localhost:$FRONTEND_PORT"
log "Press Ctrl+C to stop."

wait