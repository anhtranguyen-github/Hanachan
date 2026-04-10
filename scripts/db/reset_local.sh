#!/usr/bin/env bash
# scripts/db/reset_local.sh — Stop, reset, and restart local Supabase
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "━━━ Hanachan DB: Full Reset ━━━"
cd "$PROJECT_ROOT"

echo "→ Stopping Supabase..."
npx supabase stop 2>/dev/null || true

echo "→ Starting Supabase (clean)..."
npx supabase start 2>&1

echo ""
echo "→ Resetting database (apply migrations + seed)..."
npx supabase db reset 2>&1

echo ""
echo "✅ Local Supabase reset complete."
echo "   Studio:  http://127.0.0.1:54423"
echo "   API:     http://127.0.0.1:54421"
echo "   DB:      postgresql://postgres:postgres@127.0.0.1:54422/postgres"
