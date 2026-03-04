import json
import os
import sys
from fastapi.openapi.utils import get_openapi

def generate_spec(app_path, output_path):
    # Add project root to sys.path to allow imports
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    sys.path.insert(0, os.path.join(project_root, app_path))
    
    # Mock some env vars that might be needed for import
    os.environ["SUPABASE_URL"] = "https://test.supabase.co"
    os.environ["SUPABASE_SERVICE_KEY"] = "test-key"
    os.environ["SUPABASE_JWT_SECRET"] = "test-secret"
    
    from app.main import app
    
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        openapi_version=app.openapi_version,
        description=app.description,
        routes=app.routes,
    )
    
    with open(output_path, "w") as f:
        json.dump(openapi_schema, f, indent=2)
    print(f"Generated {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python generate-openapi.py <app_dir> <output_file>")
        sys.exit(1)
    
    generate_spec(sys.argv[1], sys.argv[2])
