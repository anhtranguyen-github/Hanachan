#!/usr/bin/env bash
set -Eeuo pipefail

########################################
# Hanachan Startup Script (Root)
########################################
#
# Usage:
#   ./run.sh dev
#   ./run.sh build
#   ./run.sh start
#

FRONTEND_PORT=${FRONTEND_PORT:-3000}
BACKEND_PORT=${BACKEND_PORT:-6100}
OMNIROUTE_PORT=${OMNIROUTE_PORT:-20128}
MODE="${1:-dev}"   # dev | build | start (or prod)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

BACKEND_PID=""
FRONTEND_PID=""
OMNIROUTE_PID=""

log() {
  echo -e "[$(date +'%H:%M:%S')] $*"
}

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

  # Fallback for environments without lsof/fuser (or where they can't see the owner).
  if command -v ss >/dev/null 2>&1; then
    local ss_pids
    ss_pids="$(ss -ltnp 2>/dev/null | awk -v p=":$port" '$4 ~ p { match($0,/pid=[0-9]+/); if (RSTART) { print substr($0,RSTART+4,RLENGTH-4) } }' | sort -u || true)"
    if [[ -n "$ss_pids" ]]; then
      log "Detected PID(s) on port $port via ss: $ss_pids"
      for pid in $ss_pids; do
        kill -TERM "$pid" 2>/dev/null || true
      done
      sleep 1
      for pid in $ss_pids; do
        kill -KILL "$pid" 2>/dev/null || true
      done
    fi
  fi

  sleep 1
}

port_in_use() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
    return $?
  fi
  if command -v ss >/dev/null 2>&1; then
    ss -ltn 2>/dev/null | awk -v p=":$port" '$4 ~ p {found=1} END{exit found?0:1}'
    return $?
  fi
  # Fallback: try to open a TCP connection (catches Windows/host listeners WSL can't see).
  if command -v curl >/dev/null 2>&1; then
    if curl -sSf "http://127.0.0.1:$port" >/dev/null 2>&1; then
      return 0
    fi
  fi
  if command -v nc >/dev/null 2>&1; then
    if nc -z 127.0.0.1 "$port" >/dev/null 2>&1; then
      return 0
    fi
  fi
  # If we still can't detect anything, assume free.
  return 1
}

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

  if [[ -n "$OMNIROUTE_PID" ]] && kill -0 "$OMNIROUTE_PID" 2>/dev/null; then
    log "Stopping OmniRoute (PID $OMNIROUTE_PID)"
    kill -TERM "$OMNIROUTE_PID" 2>/dev/null || true
  fi

  sleep 2

  if [[ -n "$FRONTEND_PID" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    log "Force killing frontend"
    kill -KILL "$FRONTEND_PID" 2>/dev/null || true
  fi

  if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    log "Force killing backend"
    kill -KILL "$BACKEND_PID" 2>/dev/null || true
  fi

  if [[ -n "$OMNIROUTE_PID" ]] && kill -0 "$OMNIROUTE_PID" 2>/dev/null; then
    log "Force killing OmniRoute"
    kill -KILL "$OMNIROUTE_PID" 2>/dev/null || true
  fi

  wait || true
  log "Shutdown complete."
  exit 0
}

trap shutdown SIGINT SIGTERM

log "☁️ Using Cloud Supabase"
log "🧹 Cleaning ports"

if ! command -v pnpm >/dev/null 2>&1; then
  log "ERROR: pnpm not found. Install pnpm (or enable corepack) and retry."
  exit 127
fi

cleanup_port "$BACKEND_PORT"
cleanup_port "$FRONTEND_PORT"
cleanup_port "$OMNIROUTE_PORT"

if port_in_use "$FRONTEND_PORT"; then
  log "ERROR: Port $FRONTEND_PORT is still in use and cannot be freed from this shell."
  log "This is common when another project (or Docker/Windows) owns the listener."
  log "Fix: stop the other project, or run with a different port:"
  log "  FRONTEND_PORT=3001 ./run.sh dev"
  exit 1
fi

case "$MODE" in
  build)
    log "🏗️ Build-only mode (frontend only)"
    cd "$ROOT_DIR/src/nextjs"
    pnpm run build
    exit 0
    ;;
  dev)
    log "🚀 Starting OmniRoute on port $OMNIROUTE_PORT"
    omniroute --port "$OMNIROUTE_PORT" --no-open > "$ROOT_DIR/omniroute.log" 2>&1 &
    OMNIROUTE_PID=$!

    log "🚀 Starting backend on port $BACKEND_PORT"
    cd "$ROOT_DIR/src/fastapi"

    uv run python -m uvicorn app.main:app \
      --host 0.0.0.0 \
      --port "$BACKEND_PORT" \
      > "$ROOT_DIR/src/fastapi/server.log" 2>&1 &

    BACKEND_PID=$!

    log "⏳ Waiting for backend health..."
    for i in {1..15}; do
      if curl -sf "http://localhost:$BACKEND_PORT/api/v1/health" >/dev/null; then
        log "✅ Backend ready"
        break
      fi
      sleep 1
    done

    cd "$ROOT_DIR/src/nextjs"
    log "🚀 Starting frontend (dev)"
    if port_in_use "$FRONTEND_PORT"; then
      log "ERROR: Port $FRONTEND_PORT became busy before starting frontend."
      log "Another process grabbed the port during startup (often a host/Windows listener)."
      log "Fix: stop that process or run with a different port, e.g.:"
      log "  FRONTEND_PORT=3001 ./run.sh dev"
      shutdown
    fi
    PORT="$FRONTEND_PORT" pnpm run dev &
    ;;
  start|prod|product)
    log "🚀 Starting OmniRoute on port $OMNIROUTE_PORT"
    omniroute --port "$OMNIROUTE_PORT" --no-open > "$ROOT_DIR/omniroute.log" 2>&1 &
    OMNIROUTE_PID=$!

    log "🚀 Starting backend on port $BACKEND_PORT"
    cd "$ROOT_DIR/src/fastapi"

    uv run python -m uvicorn app.main:app \
      --host 0.0.0.0 \
      --port "$BACKEND_PORT" \
      > "$ROOT_DIR/src/fastapi/server.log" 2>&1 &

    BACKEND_PID=$!

    log "⏳ Waiting for backend health..."
    for i in {1..15}; do
      if curl -sf "http://localhost:$BACKEND_PORT/api/v1/health" >/dev/null; then
        log "✅ Backend ready"
        break
      fi
      sleep 1
    done

    cd "$ROOT_DIR/src/nextjs"
    log "🏗️ Ensuring production build exists"
    pnpm run build
    log "🚀 Starting frontend (production start)"
    if port_in_use "$FRONTEND_PORT"; then
      log "ERROR: Port $FRONTEND_PORT became busy before starting frontend."
      log "Another process grabbed the port during startup (often a host/Windows listener)."
      log "Fix: stop that process or run with a different port, e.g.:"
      log "  FRONTEND_PORT=3001 ./run.sh start"
      shutdown
    fi
    PORT="$FRONTEND_PORT" pnpm run start &
    ;;
  *)
    log "Unknown MODE='$MODE'. Use one of: dev | build | start"
    shutdown
    ;;
esac

FRONTEND_PID=$!

log "✅ Startup complete"
log "Backend:   http://localhost:$BACKEND_PORT"
log "Frontend:  http://localhost:$FRONTEND_PORT"
log "OmniRoute: http://localhost:$OMNIROUTE_PORT"
log "Press Ctrl+C to stop."

wait
