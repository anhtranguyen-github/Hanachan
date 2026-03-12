#!/usr/bin/env bash
set -Eeuo pipefail

# Wrapper kept for backward compatibility.
# Prefer running the root script:
#   ./run.sh dev|build|start

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec "$ROOT_DIR/run.sh" "$@"