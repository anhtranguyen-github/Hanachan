#!/bin/bash
# =============================================================================
# OpenAPI Schema Export Script
# =============================================================================
# This script exports OpenAPI schemas from running FastAPI backends.
# It fetches the OpenAPI JSON from each service and saves it to the openapi/ directory.
#
# Usage:
#   ./scripts/export-openapi.sh [environment]
#
# Environments:
#   local   - Export from local development servers (default)
#   ci      - Export from CI environment (expects services to be running)
#
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${1:-local}"

# Configuration
DOMAIN_API_URL="${DOMAIN_API_URL:-http://localhost:8000}"
AGENTS_API_URL="${AGENTS_API_URL:-http://localhost:8001}"

# Output directory
OPENAPI_DIR="$PROJECT_ROOT/openapi"
mkdir -p "$OPENAPI_DIR"

echo "============================================"
echo "OpenAPI Schema Export"
echo "Environment: $ENVIRONMENT"
echo "============================================"

# Function to export OpenAPI schema from a service
export_openapi() {
    local service_name="$1"
    local api_url="$2"
    local output_file="$3"

    echo ""
    echo "Exporting OpenAPI schema from $service_name..."
    echo "  URL: $api_url/openapi.json"
    echo "  Output: $output_file"

    if ! curl -sf "$api_url/openapi.json" -o "$output_file"; then
        echo "ERROR: Failed to fetch OpenAPI schema from $service_name"
        echo "  Make sure the service is running at $api_url"
        return 1
    fi

    # Validate JSON
    if ! python3 -c "import json; json.load(open('$output_file'))" 2>/dev/null; then
        echo "ERROR: Invalid JSON received from $service_name"
        rm -f "$output_file"
        return 1
    fi

    echo "✓ Successfully exported $service_name OpenAPI schema"
}

# Export from Domain API
export_openapi "Domain API" "$DOMAIN_API_URL" "$OPENAPI_DIR/domain.json"

# Export from Agents API
export_openapi "Agents API" "$AGENTS_API_URL" "$OPENAPI_DIR/agents.json"

echo ""
echo "============================================"
echo "OpenAPI Export Complete"
echo "============================================"
echo ""
echo "Generated files:"
ls -la "$OPENAPI_DIR/"*.json 2>/dev/null || echo "  No files found"
echo ""
echo "Next steps:"
echo "  1. Commit these schemas if they represent stable API contracts"
echo "  2. Run 'pnpm generate:api' to regenerate the SDK"
echo ""
