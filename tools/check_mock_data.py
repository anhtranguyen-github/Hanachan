import ast
import os
import sys

FORBIDDEN_MOCK_DATA = [
    "John Doe",
    "Jane Doe",
    "Test User",
    "Foo Bar",
    "test@example.com",
    "admin@example.com",
    "lorem ipsum",
    "mock data",
    "dummy data",
    "fake data",
]

IGNORE_DIRS = ["tests", "test_fixtures", "examples", "dev_tools", ".venv", "node_modules", ".git", "data", "tools", ".github", "scripts", ".next", ".next_clean", "coverage", "htmlcov", ".agent", ".agents", "__pycache__"]

def check_file(filepath):
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            tree = ast.parse(f.read(), filename=filepath)
    except Exception:
        return 0
    
    violations = 0
    for node in ast.walk(tree):
        if isinstance(node, ast.Constant) and isinstance(node.value, str):
            val = node.value.lower()
            for pattern in FORBIDDEN_MOCK_DATA:
                if pattern.lower() in val:
                    print(f"{filepath}:{node.lineno} Mock or placeholder data detected -> \"{node.value}\"")
                    violations += 1
                    break
    return violations

def main():
    total_violations = 0
    for root, dirs, files in os.walk("."):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for file in files:
            if file.endswith(".py"):
                filepath = os.path.join(root, file)
                total_violations += check_file(filepath)
    
    if total_violations > 0:
        print(f"\nTotal mock data violations found: {total_violations}")
        sys.exit(1)

if __name__ == "__main__":
    main()
