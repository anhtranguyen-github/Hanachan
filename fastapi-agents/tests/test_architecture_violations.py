"""
Architecture Violation Detection Tests

These tests scan the codebase to detect violations of architectural rules.
They will FAIL if any forbidden patterns are found.

Run with: pytest fastapi-agents/tests/test_architecture_violations.py -v
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

import pytest


@dataclass
class Violation:
    """Represents a single architecture violation."""

    file_path: str
    line_number: int
    rule: str
    message: str
    code_snippet: str = ""

    def __str__(self) -> str:
        return f"[{self.rule}] {self.file_path}:{self.line_number} - {self.message}"


class ArchitectureScanner:
    """Scans Python and TypeScript files for architectural violations."""

    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.violations: list[Violation] = []

    def scan_all(self) -> list[Violation]:
        """Run all violation scans."""
        self.violations = []
        self._scan_fastapi()
        self._scan_nextjs()
        return self.violations

    def _scan_fastapi(self) -> None:
        """Scan FastAPI codebase for violations."""
        fastapi_dir = self.project_root / "fastapi-agents"
        if not fastapi_dir.exists():
            return

        for py_file in fastapi_dir.rglob("*.py"):
            # Skip test files and virtual environments
            if self._should_skip_file(py_file):
                continue

            content = py_file.read_text(encoding="utf-8")
            self._check_forbidden_imports(py_file, content)
            self._check_forbidden_jwt(py_file, content)
            self._check_in_memory_state(py_file, content)
            self._check_business_logic(py_file, content)
            self._check_direct_sql(py_file, content)
            self._check_crud_services(py_file, content)

    def _scan_nextjs(self) -> None:
        """Scan Next.js codebase for violations."""
        nextjs_dir = self.project_root / "nextjs"
        if not nextjs_dir.exists():
            return

        for ts_file in nextjs_dir.rglob("*.ts"):
            if self._should_skip_ts_file(ts_file):
                continue

            content = ts_file.read_text(encoding="utf-8")
            self._check_direct_fastapi_calls(ts_file, content)

        for tsx_file in nextjs_dir.rglob("*.tsx"):
            if self._should_skip_ts_file(tsx_file):
                continue

            content = tsx_file.read_text(encoding="utf-8")
            self._check_direct_fastapi_calls(tsx_file, content)

    def _should_skip_file(self, file_path: Path) -> bool:
        """Check if file should be skipped during scanning."""
        skip_patterns = [
            ".venv",
            "__pycache__",
            ".pytest_cache",
            ".ruff_cache",
            "node_modules",
            ".next",
            "test_architecture_violations.py",  # Skip self
        ]
        return any(pattern in str(file_path) for pattern in skip_patterns)

    def _should_skip_ts_file(self, file_path: Path) -> bool:
        """Check if TypeScript file should be skipped."""
        skip_patterns = [
            "node_modules",
            ".next",
            "coverage",
        ]
        return any(pattern in str(file_path) for pattern in skip_patterns)

    def _check_forbidden_imports(self, file_path: Path, content: str) -> None:
        """Check for forbidden imports like psycopg2, asyncpg, core.database."""
        forbidden_patterns = [
            (
                r"^\s*import\s+psycopg2",
                "FORBIDDEN_DB_DRIVER",
                "Direct psycopg2 import is forbidden. Use Supabase client instead.",
            ),
            (
                r"^\s*from\s+psycopg2",
                "FORBIDDEN_DB_DRIVER",
                "Direct psycopg2 import is forbidden. Use Supabase client instead.",
            ),
            (
                r"^\s*import\s+asyncpg",
                "FORBIDDEN_DB_DRIVER",
                "Direct asyncpg import is forbidden. Use Supabase client instead.",
            ),
            (
                r"^\s*from\s+asyncpg",
                "FORBIDDEN_DB_DRIVER",
                "Direct asyncpg import is forbidden. Use Supabase client instead.",
            ),
            (
                r"^\s*from\s+core\.database",
                "FORBIDDEN_CORE_IMPORT",
                "Import from core.database is forbidden. Use Supabase client instead.",
            ),
            (
                r"^\s*from\s+\.\.core\.database",
                "FORBIDDEN_CORE_IMPORT",
                "Import from core.database is forbidden. Use Supabase client instead.",
            ),
            (
                r"^\s*from\s+app\.core\.database",
                "FORBIDDEN_CORE_IMPORT",
                "Import from core.database is forbidden. Use Supabase client instead.",
            ),
        ]

        for pattern, rule, message in forbidden_patterns:
            for match in re.finditer(pattern, content, re.MULTILINE):
                line_num = content[: match.start()].count("\n") + 1
                line_content = content.split("\n")[line_num - 1].strip()
                self.violations.append(
                    Violation(
                        file_path=str(file_path.relative_to(self.project_root)),
                        line_number=line_num,
                        rule=rule,
                        message=message,
                        code_snippet=line_content,
                    )
                )

    def _check_forbidden_jwt(self, file_path: Path, content: str) -> None:
        """Check for JWT validation in FastAPI."""
        jwt_patterns = [
            (
                r"jwt\.decode\s*\(",
                "FORBIDDEN_JWT_VALIDATION",
                "JWT validation in FastAPI is forbidden. Auth must flow through Next.js + Supabase.",
            ),
            (
                r"jwt\.verify\s*\(",
                "FORBIDDEN_JWT_VALIDATION",
                "JWT validation in FastAPI is forbidden. Auth must flow through Next.js + Supabase.",
            ),
            (
                r"PyJWKClient",
                "FORBIDDEN_JWT_VALIDATION",
                "JWT validation in FastAPI is forbidden. Auth must flow through Next.js + Supabase.",
            ),
            (
                r"from\s+core\.security\s+import",
                "FORBIDDEN_AUTH_IMPORT",
                "Import from core.security is forbidden. Use Supabase RLS instead.",
            ),
            (
                r"from\s+\.\.core\.security\s+import",
                "FORBIDDEN_AUTH_IMPORT",
                "Import from core.security is forbidden. Use Supabase RLS instead.",
            ),
            (
                r"from\s+app\.core\.security\s+import",
                "FORBIDDEN_AUTH_IMPORT",
                "Import from core.security is forbidden. Use Supabase RLS instead.",
            ),
        ]

        for pattern, rule, message in jwt_patterns:
            for match in re.finditer(pattern, content, re.MULTILINE):
                line_num = content[: match.start()].count("\n") + 1
                line_content = content.split("\n")[line_num - 1].strip()
                self.violations.append(
                    Violation(
                        file_path=str(file_path.relative_to(self.project_root)),
                        line_number=line_num,
                        rule=rule,
                        message=message,
                        code_snippet=line_content,
                    )
                )

    def _check_in_memory_state(self, file_path: Path, content: str) -> None:
        """Check for in-memory state used as source of truth."""
        # Look for global dictionaries/lists that could be in-memory caches
        in_memory_patterns = [
            (
                r"^\s*_cache\s*=\s*\{\}",
                "IN_MEMORY_STATE",
                "In-memory cache as source of truth is forbidden. Use Supabase for persistent state.",
            ),
            (
                r"^\s*user_cache\s*=\s*\{",
                "IN_MEMORY_STATE",
                "In-memory user cache is forbidden. Use Supabase for persistent state.",
            ),
            (
                r"^\s*_store\s*=\s*\{\}",
                "IN_MEMORY_STATE",
                "In-memory store is forbidden. Use Supabase for persistent state.",
            ),
        ]

        for pattern, rule, message in in_memory_patterns:
            for match in re.finditer(pattern, content, re.MULTILINE):
                line_num = content[: match.start()].count("\n") + 1
                line_content = content.split("\n")[line_num - 1].strip()
                self.violations.append(
                    Violation(
                        file_path=str(file_path.relative_to(self.project_root)),
                        line_number=line_num,
                        rule=rule,
                        message=message,
                        code_snippet=line_content,
                    )
                )

    def _check_business_logic(self, file_path: Path, content: str) -> None:
        """Check for business logic that should be in Next.js."""
        # FSRS algorithm patterns
        fsrs_patterns = [
            (
                r"class\s+FSRS",
                "BUSINESS_LOGIC_IN_FASTAPI",
                "FSRS business logic should be in Next.js, not FastAPI.",
            ),
            (
                r"def\s+calculate_fsrs",
                "BUSINESS_LOGIC_IN_FASTAPI",
                "FSRS calculation logic should be in Next.js, not FastAPI.",
            ),
            (
                r"def\s+schedule_review",
                "BUSINESS_LOGIC_IN_FASTAPI",
                "Review scheduling logic should be in Next.js, not FastAPI.",
            ),
            (
                r"interval\s*\*\s*ease",
                "BUSINESS_LOGIC_IN_FASTAPI",
                "FSRS interval calculation should be in Next.js, not FastAPI.",
            ),
            (
                r"stability\s*\*\s*ease",
                "BUSINESS_LOGIC_IN_FASTAPI",
                "FSRS stability calculation should be in Next.js, not FastAPI.",
            ),
        ]

        for pattern, rule, message in fsrs_patterns:
            for match in re.finditer(pattern, content, re.MULTILINE):
                line_num = content[: match.start()].count("\n") + 1
                line_content = content.split("\n")[line_num - 1].strip()
                self.violations.append(
                    Violation(
                        file_path=str(file_path.relative_to(self.project_root)),
                        line_number=line_num,
                        rule=rule,
                        message=message,
                        code_snippet=line_content,
                    )
                )

    def _check_direct_sql(self, file_path: Path, content: str) -> None:
        """Check for direct SQL execution patterns."""
        sql_patterns = [
            (
                r"\.execute\s*\(\s*['\"]\s*(?:SELECT|INSERT|UPDATE|DELETE)",
                "DIRECT_SQL",
                "Direct SQL execution is forbidden. Use Supabase client with RLS.",
            ),
            (
                r"execute_query\s*\(\s*['\"]",
                "DIRECT_SQL",
                "Direct SQL execution via execute_query is forbidden. Use Supabase client with RLS.",
            ),
        ]

        for pattern, rule, message in sql_patterns:
            for match in re.finditer(pattern, content, re.MULTILINE | re.IGNORECASE):
                line_num = content[: match.start()].count("\n") + 1
                line_content = content.split("\n")[line_num - 1].strip()
                # Skip if it's a migration file or a comment
                if "#" in line_content and line_content.index("#") < line_content.index(
                    match.group(0)
                ):
                    continue
                self.violations.append(
                    Violation(
                        file_path=str(file_path.relative_to(self.project_root)),
                        line_number=line_num,
                        rule=rule,
                        message=message,
                        code_snippet=line_content,
                    )
                )

    def _check_crud_services(self, file_path: Path, content: str) -> None:
        """Check for CRUD service patterns that should not be in FastAPI."""
        # Check for service classes in FastAPI (these should be agents, not CRUD services)
        service_patterns = [
            (
                r"class\s+\w+Service\s*\(",
                "CRUD_SERVICE_IN_FASTAPI",
                "CRUD services should not exist in FastAPI. FastAPI should only have agents.",
            ),
        ]

        for pattern, rule, message in service_patterns:
            for match in re.finditer(pattern, content, re.MULTILINE):
                line_num = content[: match.start()].count("\n") + 1
                line_content = content.split("\n")[line_num - 1].strip()
                self.violations.append(
                    Violation(
                        file_path=str(file_path.relative_to(self.project_root)),
                        line_number=line_num,
                        rule=rule,
                        message=message,
                        code_snippet=line_content,
                    )
                )

    def _check_direct_fastapi_calls(self, file_path: Path, content: str) -> None:
        """Check for direct HTTP calls to FastAPI from Next.js."""
        fastapi_patterns = [
            (
                r"fetch\s*\(\s*['\"][^'\"]*fastapi",
                "DIRECT_FASTAPI_CALL",
                "Direct HTTP calls to FastAPI from Next.js are forbidden. Use Supabase-mediated workflow.",
            ),
            (
                r"axios\s*\.\s*(?:get|post|put|delete)\s*\(\s*['\"][^'\"]*fastapi",
                "DIRECT_FASTAPI_CALL",
                "Direct HTTP calls to FastAPI from Next.js are forbidden. Use Supabase-mediated workflow.",
            ),
            (
                r"['\"][^'\"]*localhost:\d+.*\/api\/v\d+",
                "DIRECT_FASTAPI_CALL",
                "Hardcoded FastAPI endpoints are forbidden. Use Supabase-mediated workflow.",
            ),
            (
                r"['\"][^'\"]*\/\/api\.[^'\"]+\/decks",
                "DIRECT_FASTAPI_CALL",
                "Direct deck API calls to FastAPI are forbidden. Use Supabase-mediated workflow.",
            ),
            (
                r"['\"][^'\"]*\/\/api\.[^'\"]+\/fsrs",
                "DIRECT_FASTAPI_CALL",
                "Direct FSRS API calls to FastAPI are forbidden. Use Supabase-mediated workflow.",
            ),
        ]

        for pattern, rule, message in fastapi_patterns:
            for match in re.finditer(pattern, content, re.MULTILINE | re.IGNORECASE):
                line_num = content[: match.start()].count("\n") + 1
                line_content = content.split("\n")[line_num - 1].strip()
                self.violations.append(
                    Violation(
                        file_path=str(file_path.relative_to(self.project_root)),
                        line_number=line_num,
                        rule=rule,
                        message=message,
                        code_snippet=line_content,
                    )
                )


# =============================================================================
# Pytest Test Cases
# =============================================================================


@pytest.fixture
def scanner() -> ArchitectureScanner:
    """Provide an architecture scanner for tests."""
    # Find project root (parent of fastapi directory)
    # Path: project_root/fastapi-agents/tests/test_architecture_violations.py
    current_file = Path(__file__).resolve()
    project_root = current_file.parent.parent.parent  # Go up to project root
    return ArchitectureScanner(project_root)


@pytest.fixture
def violations(scanner: ArchitectureScanner) -> list[Violation]:
    """Run scanner and return all violations."""
    return scanner.scan_all()


class TestFastAPIArchitecture:
    """Tests for FastAPI architectural violations."""

    def test_fastapi_no_psycopg2_imports(self, violations: list[Violation]) -> None:
        """Ensure no direct PostgreSQL driver imports in FastAPI."""
        db_violations = [v for v in violations if v.rule == "FORBIDDEN_DB_DRIVER"]
        if db_violations:
            message = "Found forbidden database driver imports:\n"
            for v in db_violations:
                message += f"  - {v}\n"
            pytest.fail(message)

    def test_fastapi_no_core_database_imports(self, violations: list[Violation]) -> None:
        """Ensure no imports from core.database in FastAPI."""
        core_violations = [v for v in violations if v.rule == "FORBIDDEN_CORE_IMPORT"]
        if core_violations:
            message = "Found forbidden core.database imports:\n"
            for v in core_violations:
                message += f"  - {v}\n"
            pytest.fail(message)

    def test_fastapi_no_jwt_validation(self, violations: list[Violation]) -> None:
        """Ensure no JWT validation in FastAPI."""
        jwt_violations = [
            v for v in violations if v.rule in ("FORBIDDEN_JWT_VALIDATION", "FORBIDDEN_AUTH_IMPORT")
        ]
        if jwt_violations:
            message = "Found forbidden JWT validation in FastAPI:\n"
            for v in jwt_violations:
                message += f"  - {v}\n"
            pytest.fail(message)

    def test_fastapi_no_in_memory_state(self, violations: list[Violation]) -> None:
        """Ensure no in-memory state as source of truth in FastAPI."""
        memory_violations = [v for v in violations if v.rule == "IN_MEMORY_STATE"]
        if memory_violations:
            message = "Found in-memory state violations:\n"
            for v in memory_violations:
                message += f"  - {v}\n"
            pytest.fail(message)

    def test_fastapi_no_business_logic(self, violations: list[Violation]) -> None:
        """Ensure FSRS/business logic is not in FastAPI."""
        logic_violations = [v for v in violations if v.rule == "BUSINESS_LOGIC_IN_FASTAPI"]
        if logic_violations:
            message = "Found business logic in FastAPI (should be in Next.js):\n"
            for v in logic_violations:
                message += f"  - {v}\n"
            pytest.fail(message)

    def test_fastapi_no_direct_sql(self, violations: list[Violation]) -> None:
        """Ensure no direct SQL execution in FastAPI."""
        sql_violations = [v for v in violations if v.rule == "DIRECT_SQL"]
        if sql_violations:
            message = "Found direct SQL execution in FastAPI:\n"
            for v in sql_violations:
                message += f"  - {v}\n"
            pytest.fail(message)

    def test_services_removed_from_fastapi(self, violations: list[Violation]) -> None:
        """Ensure CRUD services don't exist in FastAPI (only agents allowed)."""
        service_violations = [v for v in violations if v.rule == "CRUD_SERVICE_IN_FASTAPI"]
        if service_violations:
            message = "Found CRUD services in FastAPI (should be migrated to Next.js):\n"
            for v in service_violations:
                message += f"  - {v}\n"
            pytest.fail(message)


class TestNextJSArchitecture:
    """Tests for Next.js architectural violations."""

    def test_nextjs_no_direct_fastapi_calls(self, violations: list[Violation]) -> None:
        """Ensure Next.js doesn't call FastAPI directly."""
        call_violations = [v for v in violations if v.rule == "DIRECT_FASTAPI_CALL"]
        if call_violations:
            message = "Found direct FastAPI calls from Next.js:\n"
            for v in call_violations:
                message += f"  - {v}\n"
            pytest.fail(message)


class TestOverallArchitecture:
    """Tests for overall architectural compliance."""

    def test_no_critical_violations(self, violations: list[Violation]) -> None:
        """Ensure no critical architectural violations exist."""
        critical_rules = {
            "FORBIDDEN_DB_DRIVER",
            "FORBIDDEN_CORE_IMPORT",
            "FORBIDDEN_JWT_VALIDATION",
            "FORBIDDEN_AUTH_IMPORT",
            "DIRECT_FASTAPI_CALL",
        }
        critical_violations = [v for v in violations if v.rule in critical_rules]

        if critical_violations:
            message = f"Found {len(critical_violations)} CRITICAL architectural violations:\n\n"
            for v in critical_violations:
                message += f"  ❌ {v}\n"
            message += "\nThese violations must be fixed before deployment.\n"
            message += "See documentation/ARCHITECTURE_RULES.md for more information."
            pytest.fail(message)


# =============================================================================
# Standalone Execution (for CI script usage)
# =============================================================================


def main() -> int:
    """Run architecture checks and return exit code."""
    # Find project root (parent of fastapi directory)
    current_file = Path(__file__).resolve()
    project_root = current_file.parent.parent.parent

    scanner = ArchitectureScanner(project_root)
    violations = scanner.scan_all()

    if not violations:
        print("✅ No architecture violations found!")
        return 0

    # Group violations by rule
    violations_by_rule: dict[str, list[Violation]] = {}
    for v in violations:
        if v.rule not in violations_by_rule:
            violations_by_rule[v.rule] = []
        violations_by_rule[v.rule].append(v)

    print(f"\n{'=' * 80}")
    print("ARCHITECTURE VIOLATION REPORT")
    print(f"{'=' * 80}\n")

    total = len(violations)
    print(f"Total violations found: {total}\n")

    for rule, rule_violations in sorted(violations_by_rule.items()):
        print(f"\n{rule} ({len(rule_violations)} violations)")
        print("-" * 60)
        for v in rule_violations:
            print(f"  {v.file_path}:{v.line_number}")
            print(f"    {v.message}")
            if v.code_snippet:
                print(f"    Code: {v.code_snippet[:80]}")
            print()

    print(f"\n{'=' * 80}")
    print(f"❌ {total} architecture violations must be fixed!")
    print(f"{'=' * 80}")
    print("\nRefer to documentation/ARCHITECTURE_RULES.md for architectural guidelines.")

    return 1


if __name__ == "__main__":
    exit(main())
