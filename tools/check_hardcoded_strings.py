import ast
import os
import sys

FORBIDDEN_PATTERNS = [
    "http://",
    "https://",
    "/ws/",
    "/api/",
    "/v1/",
    "/v2/",
    "/users/",
    "/auth/",
]

IGNORE_DIRS = ["tests", "test_fixtures", "examples", "dev_tools", ".venv", "node_modules", ".git", "docs", "migrations", "data", "tools", ".github", "scripts", ".next", ".next_clean", "coverage", "htmlcov", ".agent", ".agents", "__pycache__"]

def check_file(filepath):
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            tree = ast.parse(content, filename=filepath)
    except Exception:
        return 0
    
    violations = 0
    for node in ast.walk(tree):
        # Python 3.8+ uses ast.Constant for strings
        if isinstance(node, ast.Constant) and isinstance(node.value, str):
            val = node.value
            for pattern in FORBIDDEN_PATTERNS:
                if pattern in val:
                    # Skip if it's just a single slash or something too short if needed, 
                    # but following the prompt strictly:
                    print(f"{filepath}:{node.lineno} Hardcoded URL or route detected -> \"{val}\"")
                    violations += 1
                    break
    return violations

def main():
    total_violations = 0
    search_root = "."
    for root, dirs, files in os.walk(search_root):
        # Modify dirs in-place to stay out of ignored directories
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        for file in files:
            if file.endswith(".py"):
                filepath = os.path.join(root, file)
                total_violations += check_file(filepath)
    
    if total_violations > 0:
        print(f"\nTotal violations found: {total_violations}")
        sys.exit(1)

if __name__ == "__main__":
    main()
