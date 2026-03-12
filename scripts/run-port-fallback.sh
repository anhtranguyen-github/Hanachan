#!/usr/bin/env bash
set -euo pipefail

# run-port-fallback.sh — manages port, connects to cloud service and falls back to local
# (previously repo-root run.sh)
# Usage:
#   CLOUD_URL="https://prod.example.com" PORT=8000 LOCAL_CMD="uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT" ./scripts/run-port-fallback.sh

PORT=${PORT:-8000}
CLOUD_URL=${CLOUD_URL:-}
LOCAL_CMD=${LOCAL_CMD:-"uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT"}
HEALTH_PATH=${HEALTH_PATH:-/health}
KILL_TIMEOUT=${KILL_TIMEOUT:-5}
START_TIMEOUT=${START_TIMEOUT:-30}

LOCAL_PID=""

log() { echo "[run-port-fallback.sh] $*"; }

cleanup() {
  if [ -n "$LOCAL_PID" ] && ps -p "$LOCAL_PID" > /dev/null 2>&1; then
    log "Stopping local process $LOCAL_PID"
    kill "$LOCAL_PID" || true
    sleep 1
    if ps -p "$LOCAL_PID" > /dev/null 2>&1; then
      kill -9 "$LOCAL_PID" || true
    fi
  fi
}

trap cleanup EXIT INT TERM

# Find and free port if occupied
if command -v lsof >/dev/null 2>&1; then
  PID_ON_PORT=$(lsof -ti TCP:"$PORT" -sTCP:LISTEN || true)
else
  PID_ON_PORT=$(ss -ltnp 2>/dev/null | awk -v p=":$PORT" '$4 ~ p { sub(/.*,pid=/,"",$6); sub(/,.*/ ,"",$6); print $6 }' || true)
fi

if [ -n "$PID_ON_PORT" ]; then
  log "Port $PORT is in use by PID(s): $PID_ON_PORT — attempting graceful stop"
  for pid in $PID_ON_PORT; do
    kill "$pid" || true
  done
  sleep "$KILL_TIMEOUT"
  # Force kill remaining
  for pid in $PID_ON_PORT; do
    if ps -p "$pid" > /dev/null 2>&1; then
      log "Force-killing $pid"
      kill -9 "$pid" || true
    fi
  done
else
  log "Port $PORT is free"
fi

SERVICE_URL=""

if [ -n "$CLOUD_URL" ]; then
  log "Checking cloud service at $CLOUD_URL$HEALTH_PATH"
  if curl --fail -s --max-time 5 "$CLOUD_URL$HEALTH_PATH" >/dev/null 2>&1; then
    SERVICE_URL="$CLOUD_URL"
    log "Cloud service reachable at $SERVICE_URL — skipping local start"
  else
    log "Cloud service unreachable — will start local service"
  fi
fi

if [ -z "$SERVICE_URL" ]; then
  log "Starting local service: $LOCAL_CMD"
  # shellcheck disable=SC2086
  eval $LOCAL_CMD &
  LOCAL_PID=$!
  SERVICE_URL="http://localhost:$PORT"
  log "Local service started (PID $LOCAL_PID), waiting for readiness"

  # Wait for health endpoint
  for i in $(seq 1 "$START_TIMEOUT"); do
    if curl --fail -s --max-time 2 "$SERVICE_URL$HEALTH_PATH" >/dev/null 2>&1; then
      log "Local service is healthy"
      break
    fi
    if ! ps -p "$LOCAL_PID" > /dev/null 2>&1; then
      log "Local process $LOCAL_PID exited unexpectedly"
      exit 1
    fi
    sleep 1
  done

  if ! curl --fail -s --max-time 2 "$SERVICE_URL$HEALTH_PATH" >/dev/null 2>&1; then
    log "Local service did not become healthy within $START_TIMEOUT seconds"
    exit 1
  fi
fi

log "Service available at $SERVICE_URL"
log "Hint: set SERVICE_URL environment variable for downstream tasks: export SERVICE_URL=$SERVICE_URL"

# If we started a local app, wait on it so signals are handled by trap/cleanup
if [ -n "$LOCAL_PID" ]; then
  wait "$LOCAL_PID"
fi

