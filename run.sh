#!/bin/bash

# Hanachan V2 Startup Script (Optimized)
# This script starts Supabase, cleans up ports, kills zombie processes, and starts services.

FRONTEND_PORT=3000
BACKEND_PORT=8765

MODE=${1:-dev}

# Root directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "--- ☁️ Phase 1: Using Cloud Supabase ---"
echo "Local Supabase stack removed. Connecting directly to Cloud DB."

echo "--- 🛠️  Phase 2: Cleanup ---"

cleanup_port() {
  local port=$1
  echo "Ensuring port $port is free..."
  
  # 1. Try fuser (very effective on Linux)
  if command -v fuser >/dev/null 2>&1; then
    fuser -k $port/tcp >/dev/null 2>&1
  fi
  
  # 2. Sequential kill for any remaining PIDs via lsof
  local pids=$(lsof -t -i:$port)
  if [ ! -z "$pids" ]; then
    echo "Killing remaining processes on $port: $pids"
    kill -9 $pids 2>/dev/null
  fi
  
  # 3. Small grace period to allow OS to release socket
  sleep 1.5
}

# Ensure we clear both ports
cleanup_port $BACKEND_PORT
cleanup_port $FRONTEND_PORT

echo "--- 🚀 Phase 3: Starting Services ---"

# Trap exits to kill background processes only on interruption
trap "echo 'Stopping...'; kill 0" SIGINT SIGTERM

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
cd "$ROOT_DIR/nextjs"

if [ "$MODE" = "prod" ] || [ "$MODE" = "product" ]; then
  echo "[Frontend] Building for production..."
  pnpm run build
  echo "[Frontend] Starting production server on port $FRONTEND_PORT..."
  PORT=$FRONTEND_PORT pnpm run start &
elif [ "$MODE" = "build" ]; then
  echo "[Frontend] Running build check..."
  pnpm run build
  echo "--- ✅ Build Complete ---"
  kill $BACKEND_PID
  exit 0
else
  echo "[Frontend] Starting dev server on port $FRONTEND_PORT using pnpm..."
  PORT=$FRONTEND_PORT pnpm run dev &
fi
FRONTEND_PID=$!

echo "--- ✅ Startup Complete ---"
echo "Backend:  http://localhost:$BACKEND_PORT"
echo "Frontend: http://localhost:$FRONTEND_PORT"
echo ""
echo "Press Ctrl+C to stop services."

# Keep script running to maintain services
wait
