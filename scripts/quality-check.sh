#!/bin/bash
set -e

# Base directory
REPO_ROOT=$(pwd)

echo "🚀 Starting Full Codebase Quality Guard System..."

PYTHON_PROJECTS=("src/fastapi")

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
    
    echo "✅ Running Architecture Guard..."
    uv run python "$REPO_ROOT/scripts/architecture-guard.py"
done

echo ""
echo "----------------------------------------------------------------"
echo "🔍 Checking Frontend: nextjs"
echo "----------------------------------------------------------------"
cd "$REPO_ROOT/src/nextjs"
echo "✅ Running ESLint..."
pnpm lint
echo "✅ Running TypeScript Check..."
pnpm exec tsc --noEmit

echo ""
echo "✨ All quality checks passed successfully!"
