#!/usr/bin/env python3
"""
Architecture Guard - CI/CD Script

This script scans the codebase for architectural violations and returns
exit code 1 if any violations are found.

Usage:
    python scripts/architecture-guard.py [options]

Options:
    --format {text,json}     Output format (default: text)
    --output FILE            Write report to file
    --strict                 Fail on any violation (including warnings)
    --help                   Show this help message

Exit Codes:
    0 - No violations found
    1 - Violations found
    2 - Error running checks
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import List, Optional


@dataclass
class Violation:
    """Represents a single architecture violation."""
    file_path: str
    line_number: int
    rule: str
    message: str
    severity: str = "ERROR"  # ERROR or WARNING
    code_snippet: str = ""

    def to_dict(self) -> dict:
        return {
            "file_path": self.file_path,
            "line_number": self.line_number,
            "rule": self.rule,
            "message": self.message,
            "severity": self.severity,
            "code_snippet": self.code_snippet,
        }

    def __str__(self) -> str:
        return f"[{self.severity}] [{self.rule}] {self.file_path}:{self.line_number} - {self.message}"


class ArchitectureGuard:
    """Scans codebase for architectural violations."""

    # Files and directories to skip
    SKIP_PATTERNS = [
        ".venv",
        "__pycache__",
        ".pytest_cache",
        ".ruff_cache",
        "node_modules",
        ".next",
        "coverage",
        "dist",
        "build",
        ".git",
        "*.pyc",
        "test_architecture_violations.py",  # Skip the test file itself
        "architecture-guard.py",  # Skip self
    ]

    # Rules definition
    RULES = {
        # FastAPI Rules
        "FORBIDDEN_DB_DRIVER": {
            "description": "Direct PostgreSQL driver imports are forbidden",
            "message": "Direct psycopg2/asyncpg import is forbidden. Use Supabase client instead.",
            "severity": "ERROR",
            "applies_to": ["fastapi/**/*.py"],
        },
        "FORBIDDEN_CORE_IMPORT": {
            "description": "Importing core.database or core.security is forbidden",
            "message": "Import from core.database/core.security is forbidden. Use Supabase client instead.",
            "severity": "ERROR",
            "applies_to": ["fastapi/**/*.py"],
        },
        "FORBIDDEN_JWT_VALIDATION": {
            "description": "JWT validation in FastAPI is forbidden",
            "message": "JWT validation in FastAPI is forbidden. Auth must flow through Next.js + Supabase.",
            "severity": "ERROR",
            "applies_to": ["fastapi/**/*.py"],
        },
        "IN_MEMORY_STATE": {
            "description": "In-memory state as source of truth",
            "message": "In-memory state is forbidden. Use Supabase for persistent state.",
            "severity": "ERROR",
            "applies_to": ["fastapi/**/*.py"],
        },
        "BUSINESS_LOGIC_IN_FASTAPI": {
            "description": "Business logic should be in Next.js, not FastAPI",
            "message": "Business logic (FSRS/scheduling) should be in Next.js, not FastAPI.",
            "severity": "ERROR",
            "applies_to": ["fastapi/**/*.py"],
        },
        "DIRECT_SQL": {
            "description": "Direct SQL execution is forbidden",
            "message": "Direct SQL execution is forbidden. Use Supabase client with RLS.",
            "severity": "ERROR",
            "applies_to": ["fastapi/**/*.py"],
        },
        "CRUD_SERVICE_IN_FASTAPI": {
            "description": "CRUD services should not exist in FastAPI",
            "message": "CRUD services should not exist in FastAPI. FastAPI should only have agents.",
            "severity": "ERROR",
            "applies_to": ["fastapi/**/*.py"],
        },
        # Next.js Rules
        "DIRECT_FASTAPI_CALL": {
            "description": "Direct HTTP calls to FastAPI from Next.js",
            "message": "Direct HTTP calls to FastAPI are forbidden. Use Supabase-mediated workflow.",
            "severity": "ERROR",
            "applies_to": ["nextjs/**/*.ts", "nextjs/**/*.tsx"],
        },
        # Python Rules
        "IN_MEMORY_CACHE_GLOBAL": {
            "description": "Global in-memory cache variables",
            "message": "Global in-memory caches will not persist across deployments.",
            "severity": "WARNING",
            "applies_to": ["fastapi/**/*.py"],
        },
    }

    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.violations: List[Violation] = []

    def should_skip_file(self, file_path: Path) -> bool:
        """Check if file should be skipped."""
        path_str = str(file_path)
        for pattern in self.SKIP_PATTERNS:
            if pattern in path_str:
                return True
            if pattern.startswith("*") and path_str.endswith(pattern[1:]):
                return True
        return False

    def scan(self) -> List[Violation]:
        """Run all scans and return violations."""
        self.violations = []
        self._scan_fastapi()
        self._scan_nextjs()
        return self.violations

    def _scan_fastapi(self) -> None:
        """Scan FastAPI directory for violations."""
        fastapi_dir = self.project_root / "fastapi"
        if not fastapi_dir.exists():
            print(f"Warning: FastAPI directory not found at {fastapi_dir}")
            return

        for py_file in fastapi_dir.rglob("*.py"):
            if self.should_skip_file(py_file):
                continue

            try:
                content = py_file.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue

            rel_path = py_file.relative_to(self.project_root)

            self._check_db_imports(rel_path, content)
            self._check_jwt_validation(rel_path, content)
            self._check_in_memory_state(rel_path, content)
            self._check_business_logic(rel_path, content)
            self._check_direct_sql(rel_path, content)
            self._check_crud_services(rel_path, content)
            self._check_global_cache(rel_path, content)

    def _scan_nextjs(self) -> None:
        """Scan Next.js directory for violations."""
        nextjs_dir = self.project_root / "nextjs"
        if not nextjs_dir.exists():
            print(f"Warning: Next.js directory not found at {nextjs_dir}")
            return

        for pattern in ["**/*.ts", "**/*.tsx"]:
            for ts_file in nextjs_dir.rglob(pattern):
                if self.should_skip_file(ts_file):
                    continue

                try:
                    content = ts_file.read_text(encoding="utf-8")
                except UnicodeDecodeError:
                    continue

                rel_path = ts_file.relative_to(self.project_root)
                self._check_fastapi_calls(rel_path, content)

    def _add_violation(
        self,
        file_path: Path,
        line_num: int,
        rule_id: str,
        code_snippet: str = "",
    ) -> None:
        """Add a violation to the list."""
        rule = self.RULES.get(rule_id, {})
        self.violations.append(Violation(
            file_path=str(file_path),
            line_number=line_num,
            rule=rule_id,
            message=rule.get("message", "Unknown violation"),
            severity=rule.get("severity", "ERROR"),
            code_snippet=code_snippet.strip()[:100] if code_snippet else "",
        ))

    def _check_db_imports(self, file_path: Path, content: str) -> None:
        """Check for forbidden database imports."""
        patterns = [
            (r"^\s*import\s+psycopg2", "FORBIDDEN_DB_DRIVER"),
            (r"^\s*from\s+psycopg2", "FORBIDDEN_DB_DRIVER"),
            (r"^\s*import\s+asyncpg", "FORBIDDEN_DB_DRIVER"),
            (r"^\s*from\s+asyncpg", "FORBIDDEN_DB_DRIVER"),
            (r"^\s*from\s+core\.database", "FORBIDDEN_CORE_IMPORT"),
            (r"^\s*from\s+\.\.core\.database", "FORBIDDEN_CORE_IMPORT"),
            (r"^\s*from\s+\.\.\.core\.database", "FORBIDDEN_CORE_IMPORT"),
            (r"^\s*from\s+app\.core\.database", "FORBIDDEN_CORE_IMPORT"),
            (r"^\s*from\s+core\.security", "FORBIDDEN_CORE_IMPORT"),
            (r"^\s*from\s+\.\.core\.security", "FORBIDDEN_CORE_IMPORT"),
        ]

        for pattern, rule_id in patterns:
            for match in re.finditer(pattern, content, re.MULTILINE):
                line_num = content[:match.start()].count("\n") + 1
                line_content = content.split("\n")[line_num - 1] if line_num <= len(content.split("\n")) else ""
                self._add_violation(file_path, line_num, rule_id, line_content)

    def _check_jwt_validation(self, file_path: Path, content: str) -> None:
        """Check for JWT validation patterns."""
        patterns = [
            (r"jwt\.decode\s*\(", "FORBIDDEN_JWT_VALIDATION"),
            (r"jwt\.verify\s*\(", "FORBIDDEN_JWT_VALIDATION"),
            (r"PyJWKClient", "FORBIDDEN_JWT_VALIDATION"),
            (r"from\s+jwt\s+import", "FORBIDDEN_JWT_VALIDATION"),
        ]

        for pattern, rule_id in patterns:
            for match in re.finditer(pattern, content, re.MULTILINE):
                line_num = content[:match.start()].count("\n") + 1
                line_content = content.split("\n")[line_num - 1] if line_num <= len(content.split("\n")) else ""
                self._add_violation(file_path, line_num, rule_id, line_content)

    def _check_in_memory_state(self, file_path: Path, content: str) -> None:
        """Check for in-memory state patterns."""
        patterns = [
            (r"^\s*_cache\s*=\s*\{\}", "IN_MEMORY_STATE"),
            (r"^\s*user_cache\s*=\s*\{", "IN_MEMORY_STATE"),
            (r"^\s*_store\s*=\s*\{\}", "IN_MEMORY_STATE"),
            (r"^\s*STATE\s*=\s*\{", "IN_MEMORY_STATE"),
        ]

        for pattern, rule_id in patterns:
            for match in re.finditer(pattern, content, re.MULTILINE):
                line_num = content[:match.start()].count("\n") + 1
                line_content = content.split("\n")[line_num - 1] if line_num <= len(content.split("\n")) else ""
                self._add_violation(file_path, line_num, rule_id, line_content)

    def _check_business_logic(self, file_path: Path, content: str) -> None:
        """Check for business logic in FastAPI."""
        patterns = [
            (r"class\s+FSRS\w*", "BUSINESS_LOGIC_IN_FASTAPI"),
            (r"def\s+calculate_fsrs", "BUSINESS_LOGIC_IN_FASTAPI"),
            (r"def\s+schedule_review", "BUSINESS_LOGIC_IN_FASTAPI"),
            (r"interval\s*\*\s*ease_factor", "BUSINESS_LOGIC_IN_FASTAPI"),
            (r"stability\s*\*\s*\w+", "BUSINESS_LOGIC_IN_FASTAPI"),
        ]

        for pattern, rule_id in patterns:
            for match in re.finditer(pattern, content, re.MULTILINE):
                line_num = content[:match.start()].count("\n") + 1
                line_content = content.split("\n")[line_num - 1] if line_num <= len(content.split("\n")) else ""
                self._add_violation(file_path, line_num, rule_id, line_content)

    def _check_direct_sql(self, file_path: Path, content: str) -> None:
        """Check for direct SQL execution."""
        # Look for execute_query and similar patterns
        patterns = [
            (r"execute_query\s*\(", "DIRECT_SQL"),
            (r"execute_single\s*\(", "DIRECT_SQL"),
            (r"\.execute\s*\(\s*['\"]\s*(?:SELECT|INSERT|UPDATE|DELETE)", "DIRECT_SQL"),
            (r"get_db\s*\(\)", "DIRECT_SQL"),
            (r"get_db_pool", "DIRECT_SQL"),
        ]

        for pattern, rule_id in patterns:
            for match in re.finditer(pattern, content, re.MULTILINE | re.IGNORECASE):
                line_num = content[:match.start()].count("\n") + 1
                line_content = content.split("\n")[line_num - 1] if line_num <= len(content.split("\n")) else ""
                # Skip comments and test files
                if line_content.strip().startswith("#") or line_content.strip().startswith('"""'):
                    continue
                self._add_violation(file_path, line_num, rule_id, line_content)

    def _check_crud_services(self, file_path: Path, content: str) -> None:
        """Check for CRUD service classes."""
        # Check for Service classes (but allow Agent classes)
        pattern = r"class\s+(\w+Service)\s*\("
        for match in re.finditer(pattern, content, re.MULTILINE):
            line_num = content[:match.start()].count("\n") + 1
            line_content = content.split("\n")[line_num - 1] if line_num <= len(content.split("\n")) else ""
            self._add_violation(file_path, line_num, "CRUD_SERVICE_IN_FASTAPI", line_content)

    def _check_global_cache(self, file_path: Path, content: str) -> None:
        """Check for global cache variables."""
        patterns = [
            (r"^\s*_\w+_cache\s*=\s*\{", "IN_MEMORY_CACHE_GLOBAL"),
            (r"^\s*__\w+_cache\s*=\s*\{", "IN_MEMORY_CACHE_GLOBAL"),
        ]

        for pattern, rule_id in patterns:
            for match in re.finditer(pattern, content, re.MULTILINE):
                line_num = content[:match.start()].count("\n") + 1
                line_content = content.split("\n")[line_num - 1] if line_num <= len(content.split("\n")) else ""
                self._add_violation(file_path, line_num, rule_id, line_content)

    def _check_fastapi_calls(self, file_path: Path, content: str) -> None:
        """Check for direct FastAPI calls from Next.js."""
        patterns = [
            (r"fetch\s*\(\s*['\"][^'\"]*fastapi", "DIRECT_FASTAPI_CALL"),
            (r"axios\.[a-z]+\s*\(\s*['\"][^'\"]*fastapi", "DIRECT_FASTAPI_CALL"),
            (r"['\"][^'\"]*localhost:\d+/api/v\d+", "DIRECT_FASTAPI_CALL"),
            (r"['\"][^'\"]*127\.0\.0\.1:\d+/api", "DIRECT_FASTAPI_CALL"),
        ]

        for pattern, rule_id in patterns:
            for match in re.finditer(pattern, content, re.MULTILINE | re.IGNORECASE):
                line_num = content[:match.start()].count("\n") + 1
                line_content = content.split("\n")[line_num - 1] if line_num <= len(content.split("\n")) else ""
                self._add_violation(file_path, line_num, rule_id, line_content)


def print_text_report(violations: List[Violation], rules: dict) -> None:
    """Print violations in text format."""
    if not violations:
        print("\n" + "=" * 80)
        print("✅ NO ARCHITECTURE VIOLATIONS FOUND")
        print("=" * 80)
        print("\nYour codebase is compliant with architectural rules!")
        return

    # Group by severity
    errors = [v for v in violations if v.severity == "ERROR"]
    warnings = [v for v in violations if v.severity == "WARNING"]

    print("\n" + "=" * 80)
    print("❌ ARCHITECTURE VIOLATIONS DETECTED")
    print("=" * 80)

    if errors:
        print(f"\nERRORS ({len(errors)}):\n")
        print("-" * 80)
        for v in errors:
            print(f"\n[{v.rule}] {v.file_path}:{v.line_number}")
            print(f"  {v.message}")
            if v.code_snippet:
                print(f"  Code: {v.code_snippet[:80]}")

    if warnings:
        print(f"\n\nWARNINGS ({len(warnings)}):\n")
        print("-" * 80)
        for v in warnings:
            print(f"\n[{v.rule}] {v.file_path}:{v.line_number}")
            print(f"  {v.message}")
            if v.code_snippet:
                print(f"  Code: {v.code_snippet[:80]}")

    print("\n" + "=" * 80)
    print(f"Total: {len(errors)} errors, {len(warnings)} warnings")
    print("=" * 80)
    print("\nRefer to documentation/ARCHITECTURE_RULES.md for guidelines.")


def print_json_report(violations: List[Violation], output_file: Optional[str] = None) -> None:
    """Print or save violations in JSON format."""
    report = {
        "total_violations": len(violations),
        "errors": len([v for v in violations if v.severity == "ERROR"]),
        "warnings": len([v for v in violations if v.severity == "WARNING"]),
        "violations": [v.to_dict() for v in violations],
    }

    json_output = json.dumps(report, indent=2)

    if output_file:
        Path(output_file).write_text(json_output)
        print(f"Report saved to: {output_file}")
    else:
        print(json_output)


def main() -> int:
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Architecture Guard - Check for architectural violations",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python scripts/architecture-guard.py
    python scripts/architecture-guard.py --format json
    python scripts/architecture-guard.py --output report.json
    python scripts/architecture-guard.py --strict
        """,
    )
    parser.add_argument(
        "--format",
        choices=["text", "json"],
        default="text",
        help="Output format (default: text)",
    )
    parser.add_argument(
        "--output",
        type=str,
        help="Write report to file",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Fail on any violation including warnings",
    )

    args = parser.parse_args()

    # Find project root
    script_dir = Path(__file__).parent.absolute()
    project_root = script_dir.parent

    print(f"Architecture Guard v1.0")
    print(f"Project root: {project_root}")
    print(f"Scanning...")

    guard = ArchitectureGuard(project_root)
    violations = guard.scan()

    if args.format == "json":
        print_json_report(violations, args.output)
    else:
        print_text_report(violations, guard.RULES)

    # Determine exit code
    errors = [v for v in violations if v.severity == "ERROR"]
    warnings = [v for v in violations if v.severity == "WARNING"]

    if errors or (args.strict and warnings):
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
