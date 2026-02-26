#!/bin/bash

# Hanachan V2 Startup Script (Optimized)
# This script cleans up ports, kills zombie processes, uses pnpm, and starts services.

FRONTEND_PORT=3000
BACKEND_PORT=8765

echo "--- 🛠️  Phase 1: Cleanup ---"

cleanup_port() {
  local port=$1
  echo "Checking port $port..."
  # Find PIDs using the port (TCP)
  local pids=$(lsof -t -i:$port)
  
  if [ ! -z "$pids" ]; then
    echo "Found processes on port $port: $pids. Killing them..."
    for pid in $pids; do
      kill -9 $pid 2>/dev/null
    done
    sleep 1
  else
    echo "Port $port is already free."
  fi
}

# Ensure we clear both ports
cleanup_port $BACKEND_PORT
cleanup_port $FRONTEND_PORT

echo "--- 🚀 Phase 2: Starting Services ---"

# Root directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Trap exits to kill background processes
trap "echo 'Stopping...'; kill 0" EXIT

# 1. Start FastAPI Backend
echo "[Backend] Starting on port $BACKEND_PORT..."
cd "$ROOT_DIR/fastapi"
# Use uv to run the backend
uv run uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT > "$ROOT_DIR/fastapi/server.log" 2>&1 &
BACKEND_PID=$!

# Wait for backend health
echo "[Backend] Waiting for initialization..."
for i in {1..10}; do
  if curl -s "http://localhost:$BACKEND_PORT/health" > /dev/null; then
    echo "[Backend] Ready ✓"
    break
  fi
  sleep 1
  if [ $i -eq 10 ]; then
    echo "[Backend] Warning: Health check timed out, but proceeding anyway."
  fi
done

# 2. Start Next.js Frontend with pnpm
echo "[Frontend] Starting on port $FRONTEND_PORT using pnpm..."
cd "$ROOT_DIR/nextjs"
PORT=$FRONTEND_PORT pnpm run dev &
FRONTEND_PID=$!

echo "--- ✅ Startup Complete ---"
echo "Backend: http://localhost:$BACKEND_PORT"
echo "Frontend: http://localhost:$FRONTEND_PORT"
echo ""
echo "Press Ctrl+C to stop both services."

# Keep script running to maintain services
wait
