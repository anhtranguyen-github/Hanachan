#!/bin/bash
set -e

# Base directory
REPO_ROOT=$(pwd)

echo "🚀 Starting Full Codebase Quality Guard System..."

PYTHON_PROJECTS=("fastapi-agents" "fastapi-core")

for proj in "${PYTHON_PROJECTS[@]}"; do
    echo ""
    echo "----------------------------------------------------------------"
    echo "🔍 Checking Python Service: $proj"
    echo "----------------------------------------------------------------"
    cd "$REPO_ROOT/$proj"
    
    echo "✅ Running Ruff (style, imports, bugs)..."
    uv run ruff check .
    
    echo "✅ Running Bandit (security)..."
    uv run bandit -r . -c pyproject.toml || uv run bandit -r .
    
    echo "✅ Running detect-secrets..."
    if [ ! -f .secrets.baseline ]; then
        echo "⚠️  No secrets baseline found, creating one..."
        uv run detect-secrets scan > .secrets.baseline
    fi
    uv run detect-secrets scan --baseline .secrets.baseline .
    
    echo "✅ Running Import Linter (arch boundaries)..."
    uv run lint-imports
done

echo ""
echo "----------------------------------------------------------------"
echo "🔍 Checking Frontend: nextjs"
echo "----------------------------------------------------------------"
cd "$REPO_ROOT/nextjs"
echo "✅ Running ESLint..."
pnpm lint
echo "✅ Running TypeScript Check..."
pnpm exec tsc --noEmit

echo ""
echo "----------------------------------------------------------------"
echo "🛠️  Running Custom Scanners"
echo "----------------------------------------------------------------"
cd "$REPO_ROOT"

echo "✅ Checking for hardcoded URLs and routes..."
python3 tools/check_hardcoded_strings.py

echo "✅ Checking for mock/placeholder data..."
python3 tools/check_mock_data.py

echo "✅ Checking for debug artifacts (print, TODO, etc.)..."
python3 tools/check_debug_artifacts.py

echo ""
echo "✨ All quality checks passed successfully!"
