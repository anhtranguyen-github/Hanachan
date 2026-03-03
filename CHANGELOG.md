# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Phase 1: Architectural Safety Remediation (COMPLETE)

**Status**: All 6 sub-phases completed on 2026-03-03

#### Phase 1 Summary

Phase 1 established architectural guardrails and removed critical violations from the FastAPI codebase, ensuring alignment with the "Supabase as Single Source of Truth" principle.

| Sub-Phase | Description | Status |
|-----------|-------------|--------|
| 1.1 | Architecture violations audit (50+ violations cataloged) | ✅ Complete |
| 1.2 | ARCHITECTURE_RULES.md created | ✅ Complete |
| 1.3 | Architecture violation detection tests and CI guards | ✅ Complete |
| 1.4 | Removed direct PostgreSQL access (psycopg2 removed from core) | ✅ Complete |
| 1.5 | Removed JWT authentication from FastAPI (auth moved to Next.js) | ✅ Complete |
| 1.6 | Eliminated in-memory state treated as truth (video_dictation fixed) | ✅ Complete |

#### Phase 1.1 - Audit and Documentation (2026-03-03)

##### Added
- **CRITICAL**: Comprehensive architecture violations audit ([`documentation/ARCHITECTURE_VIOLATIONS_AUDIT.md`](documentation/ARCHITECTURE_VIOLATIONS_AUDIT.md))
  - Documented 50+ critical violations across FastAPI codebase
  - Cataloged 32 files with direct PostgreSQL access via psycopg2
  - Identified 14 files with JWT/auth logic violations
  - Listed 9 business logic services requiring migration to Next.js
  - Created 4-phase migration strategy with timeline

##### Security
- **CRITICAL**: Identified FastAPI JWT authentication bypassing Next.js/Supabase
  - [`fastapi/app/core/security.py`](fastapi/app/core/security.py:1): Full JWT validation (L1-L93)
  - 14 endpoint files using `require_auth` dependency
  - Violates "auth flows through Next.js + Supabase" principle

##### Architecture
- **CRITICAL**: Documented violation of "Supabase as Single Source of Truth"
  - [`fastapi/app/core/database.py`](fastapi/app/core/database.py:1): Direct psycopg2 connection pool
  - 32 files with direct SQL queries bypassing RLS
  - Business logic scattered across FastAPI services

##### Migration Plan
- Phase 1 (Weeks 1-2): Remove DB/auth from FastAPI
- Phase 2 (Weeks 3-4): Move business logic to Next.js
- Phase 3 (Weeks 5-6): Supabase-mediated workflow
- Phase 4 (Week 7): Architecture guards and CI/CD enforcement

#### Phase 1.2 - Architecture Guard Implementation (2026-03-03)

##### Added
- **Architecture Violation Detection Tests** ([`fastapi/tests/test_architecture_violations.py`](fastapi/tests/test_architecture_violations.py))
  - Automated tests that scan codebase and FAIL if architectural violations exist
  - Tests for forbidden imports (psycopg2, asyncpg, direct DB access)
  - Tests for forbidden auth patterns (JWT validation in FastAPI)
  - Tests for in-memory state violations
  - Tests for business logic in wrong layer (FSRS in FastAPI)
  - Tests for direct FastAPI calls from Next.js
  - Comprehensive test suite with clear error messages

- **Standalone CI Guard Script** ([`scripts/architecture-guard.py`](scripts/architecture-guard.py))
  - Command-line tool for CI/CD integration
  - Returns exit code 1 if violations found
  - Generates JSON/text reports of violations
  - Supports `--strict` mode for zero-tolerance enforcement
  - Can be run locally by developers before committing

##### CI/CD
- **GitHub Actions Workflow** ([`.github/workflows/architecture-guard.yml`](.github/workflows/architecture-guard.yml))
  - Runs on every PR and push to main
  - Three jobs: Full scan, Pytest tests, Quick PR check
  - Uploads violation reports as artifacts
  - Posts PR comments with violation details
  - Fails builds if violations are introduced

#### Phase 1.3 - Detection Rules Implementation (2026-03-03)

##### Added
- **Comprehensive Violation Detection Rules**:
  - `FORBIDDEN_DB_DRIVER`: Direct psycopg2/asyncpg imports
  - `FORBIDDEN_CORE_IMPORT`: Imports from core.database/core.security
  - `FORBIDDEN_JWT_VALIDATION`: JWT decoding/verification in FastAPI
  - `IN_MEMORY_STATE`: Global in-memory caches as source of truth
  - `BUSINESS_LOGIC_IN_FASTAPI`: FSRS/scheduling algorithms in FastAPI
  - `DIRECT_SQL`: SQL execution via execute_query or cursor.execute
  - `CRUD_SERVICE_IN_FASTAPI`: Service classes in FastAPI (should be agents)
  - `DIRECT_FASTAPI_CALL`: HTTP calls to FastAPI from Next.js

##### Documentation
- Updated architecture rules with detection patterns
- Added CI/CD integration guidelines
- Created violation reporting format specification

#### Phase 1.4 - Remove Direct PostgreSQL Access (2026-03-03)

##### Removed
- **BREAKING**: Direct PostgreSQL access via psycopg2 from FastAPI core
  - [`fastapi/app/core/database.py`](fastapi/app/core/database.py): Connection pool and query utilities removed
  - [`fastapi/app/core/config.py`](fastapi/app/core/config.py): DB_PASSWORD and database connection settings removed
  - [`fastapi/requirements.txt`](fastapi/requirements.txt): psycopg2-binary dependency removed
  - [`fastapi/pyproject.toml`](fastapi/pyproject.toml): psycopg2 dependency removed from package config

##### Changed
- All database access now routed through Supabase client
- Services using direct DB will fail with `ArchitectureViolationError`

#### Phase 1.5 - Remove JWT Authentication from FastAPI (2026-03-03)

##### Removed
- **BREAKING**: JWT token validation from FastAPI
  - [`fastapi/app/core/security.py`](fastapi/app/core/security.py): `require_auth` dependency and JWT validation removed
  - [`fastapi/app/core/admin_security.py`](fastapi/app/core/admin_security.py): Admin JWT validation removed
  - All 12 endpoint files in [`fastapi/app/api/v1/endpoints/`](fastapi/app/api/v1/endpoints/): JWT dependencies removed

##### Changed
- Endpoints now accept `user_id` as explicit parameter instead of extracting from JWT
- Authentication consolidated in Next.js BFF layer
- FastAPI receives pre-authenticated requests from Next.js only

#### Phase 1.6 - Eliminate In-Memory State (2026-03-03)

##### Fixed
- **CRITICAL**: Eliminated in-memory state treated as source of truth
  - [`fastapi/app/services/video_dictation.py`](fastapi/app/services/video_dictation.py): Removed `_dictation_sessions` global dictionary
  - Session progress now computed from database queries (`video_dictation_attempts` table)
  - Session status now survives server restarts (enables horizontal scalability)

##### Architecture
- Verified all in-memory patterns across FastAPI codebase
- Confirmed remaining caches are acceptable (not source of truth)

---

### Breaking Changes

| Change | Impact | Migration |
|--------|--------|-----------|
| FastAPI no longer has direct DB access | Services using `get_db_connection()` will fail | Use Supabase client through Next.js BFF |
| FastAPI no longer validates JWT tokens | `require_auth` dependency removed | Pass `user_id` as explicit parameter |
| Endpoints accept `user_id` parameter | JWT no longer parsed in FastAPI | Next.js must extract user_id and pass to FastAPI |
| Direct SQL queries blocked | `ArchitectureViolationError` raised | Migrate queries to Next.js/Supabase |

### Security Impact

- **All database access now goes through Supabase RLS**: Row Level Security policies enforced uniformly
- **Authentication consolidated in BFF layer**: Single auth responsibility in Next.js
- **No auth bypass possible in FastAPI**: FastAPI endpoints receive pre-authenticated requests only
- **Eliminated horizontal scaling blockers**: In-memory state removed

### Migration Notes

1. **For API Clients**: Update all FastAPI calls to include `user_id` as explicit parameter
2. **For Next.js Developers**: Extract user_id from Supabase session before calling FastAPI
3. **For Service Developers**: Move any new database queries to Next.js layer
4. **CI/CD**: Architecture guard will fail builds introducing violations

### Files Affected

#### Created
- [`documentation/ARCHITECTURE_VIOLATIONS_AUDIT.md`](documentation/ARCHITECTURE_VIOLATIONS_AUDIT.md)
- [`documentation/ARCHITECTURE_RULES.md`](documentation/ARCHITECTURE_RULES.md)
- [`documentation/PHASE_1_6_IN_MEMORY_STATE_AUDIT.md`](documentation/PHASE_1_6_IN_MEMORY_STATE_AUDIT.md)
- [`fastapi/tests/test_architecture_violations.py`](fastapi/tests/test_architecture_violations.py)
- [`scripts/architecture-guard.py`](scripts/architecture-guard.py)
- [`.github/workflows/architecture-guard.yml`](.github/workflows/architecture-guard.yml)

#### Modified (Phase 1)
- [`fastapi/app/core/database.py`](fastapi/app/core/database.py) - **REMOVED**
- [`fastapi/app/core/config.py`](fastapi/app/core/config.py) - DB settings removed
- [`fastapi/app/main.py`](fastapi/app/main.py) - DB initialization removed
- [`fastapi/app/core/security.py`](fastapi/app/core/security.py) - JWT validation removed
- [`fastapi/app/core/admin_security.py`](fastapi/app/core/admin_security.py) - Admin auth removed
- [`fastapi/app/api/v1/endpoints/*.py`](fastapi/app/api/v1/endpoints/) - All 12 files updated
- [`fastapi/app/services/video_dictation.py`](fastapi/app/services/video_dictation.py) - In-memory state removed
- [`fastapi/requirements.txt`](fastapi/requirements.txt) - psycopg2 removed
- [`fastapi/pyproject.toml`](fastapi/pyproject.toml) - psycopg2 removed
- [`fastapi/tests/test_security.py`](fastapi/tests/test_security.py) - Tests updated

---

## [2.0.0] - Planned - Architecture v2 Completion

### Changed
- FastAPI: Stateless agent host only
- Next.js: Fat workflow layer with all business logic
- All data access through Supabase with RLS

### Removed
- **BREAKING**: Direct PostgreSQL access from FastAPI
- **BREAKING**: JWT validation in FastAPI
- **BREAKING**: All CRUD services from FastAPI

---

## [1.x.x] - Pre-Remediation

See [fastapi/CHANGELOG.md](fastapi/CHANGELOG.md) for detailed FastAPI changes prior to architectural remediation.

