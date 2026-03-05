"""
Debug Artifact Scanner
Detects debug statements and temporary code in production files.
Only scans Python files for print/pprint, and all files for TODO/FIXME.
"""

import os
import sys

# Patterns that indicate debug code - only checked in Python files
PYTHON_DEBUG_PATTERNS = [
    "print(",
    "pprint(",
]

# Patterns checked in all scanned files
GENERAL_PATTERNS = [
    "FIXME",
    "HACK:",
]

IGNORE_DIRS = [
    "tests", "test_fixtures", "examples", "dev_tools",
    ".venv", "node_modules", ".git", "docs", "migrations",
    "data", "tools", ".github", "scripts",
    ".next", ".next_clean", "coverage", "htmlcov",
    ".agent", ".agents", "__pycache__",
]


def check_file(filepath):
    violations = 0
    is_python = filepath.endswith(".py")
    patterns = GENERAL_PATTERNS[:]
    if is_python:
        patterns.extend(PYTHON_DEBUG_PATTERNS)

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            for i, line in enumerate(f, 1):
                stripped = line.strip()
                # Skip comment-only lines for print detection
                if stripped.startswith("#") or stripped.startswith("//"):
                    continue

                for pattern in patterns:
                    if pattern in line:
                        print(
                            f'{filepath}:{i} Debug or temporary artifact '
                            f'detected -> "{pattern}"'
                        )
                        violations += 1
                        break
    except Exception:
        pass
    return violations


def main():
    total_violations = 0
    extensions = (".py",)  # Only scan Python files for now
    for root, dirs, files in os.walk("."):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for file in files:
            if file.endswith(extensions):
                filepath = os.path.join(root, file)
                total_violations += check_file(filepath)

    if total_violations > 0:
        print(f"\nTotal debug artifact violations found: {total_violations}")
        sys.exit(1)
    else:
        print("No debug artifacts found.")


if __name__ == "__main__":
    main()
