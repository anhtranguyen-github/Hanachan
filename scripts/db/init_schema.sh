#!/usr/bin/env bash
# scripts/db/init_schema.sh — Apply all Supabase migrations
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "━━━ Hanachan DB: Applying Migrations ━━━"
cd "$PROJECT_ROOT"

npx supabase db reset 2>&1

echo ""
echo "✅ Migrations applied successfully."
echo "   Studio: http://127.0.0.1:54423"
echo "   DB URL:  postgresql://postgres:postgres@127.0.0.1:54422/postgres"
