#!/usr/bin/env python3
"""
Contract Verification Script

Validates that OpenAPI schemas meet required standards and contain
expected endpoints.

Usage:
    python verify-contract.py <openapi-file>

Exit codes:
    0 - Contract is valid
    1 - Contract validation failed
"""

import json
import sys
from pathlib import Path


def validate_contract(file_path: str) -> bool:
    """Validate an OpenAPI contract."""
    path = Path(file_path)
    
    if not path.exists():
        print(f"Error: File not found: {file_path}")
        return False
    
    try:
        with open(path) as f:
            schema = json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON: {e}")
        return False
    
    errors = []
    
    # Check required root fields
    required_root = ["openapi", "info", "paths"]
    for field in required_root:
        if field not in schema:
            errors.append(f"Missing required field: {field}")
    
    # Check OpenAPI version
    if "openapi" in schema:
        version = schema["openapi"]
        if not version.startswith("3."):
            errors.append(f"Unsupported OpenAPI version: {version}")
    
    # Check info fields
    if "info" in schema:
        info = schema["info"]
        if "title" not in info:
            errors.append("Missing info.title")
        if "version" not in info:
            errors.append("Missing info.version")
    
    # Check for required endpoints
    if "paths" in schema:
        paths = schema["paths"]
        
        # Health endpoint is required
        if "/health" not in paths:
            errors.append("Missing /health endpoint")
        
        # Check that endpoints have required fields
        for path, methods in paths.items():
            if "get" in methods:
                get_method = methods["get"]
                if "responses" not in get_method:
                    errors.append(f"{path} GET missing responses")
            if "post" in methods:
                post_method = methods["post"]
                if "responses" not in post_method:
                    errors.append(f"{path} POST missing responses")
    
    # Check components/schemas if present
    if "components" in schema:
        components = schema["components"]
        if "schemas" in components:
            schemas = components["schemas"]
            print(f"  Found {len(schemas)} schemas")
    
    # Report results
    if errors:
        print(f"\nContract validation FAILED for {file_path}")
        print(f"Errors found ({len(errors)}):")
        for error in errors:
            print(f"  - {error}")
        return False
    else:
        print(f"Contract validation PASSED for {file_path}")
        print(f"  OpenAPI version: {schema.get('openapi', 'unknown')}")
        print(f"  Title: {schema.get('info', {}).get('title', 'unknown')}")
        print(f"  Version: {schema.get('info', {}).get('version', 'unknown')}")
        print(f"  Paths: {len(schema.get('paths', {}))}")
        return True


def main():
    if len(sys.argv) < 2:
        print("Usage: python verify-contract.py <openapi-file>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    if validate_contract(file_path):
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
