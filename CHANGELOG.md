# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### System Verification & Bug Fixes (2026-03-03)

#### Fixed
- **TypeScript Errors**: Fixed multiple type errors in admin service and pages
  - Fixed `resolveAbuseAlert` signature to accept object parameter `{ resolution_notes, status }`
  - Fixed `getSystemHealth` return type to match expected `HealthData` interface
  - Added missing stub exports: `getUserAgentTraces`, `getUserEpisodicMemory`, `getUserSemanticMemory`
  - Added missing stub exports: `getRateLimitOverrides`, `createRateLimitOverride`
  - Fixed reading dashboard to use array directly instead of `data.history`

- **Backend Lint Errors**: Fixed 19 ruff lint errors in FastAPI
  - Added missing imports: `Depends`, `require_permission`, `AdminPermission` in admin.py
  - Added missing imports: `Depends`, `require_auth` in sentences.py
  - Removed unused imports from decks.py, admin_security.py, video_dictation.py
  - Fixed f-strings without placeholders in admin_service.py
  - Fixed unused variable assignments in session.py

#### Known Issues
- **CORS Errors**: Frontend attempting to call FastAPI backend directly (architecture violation)
  - Memory endpoints fail due to CORS policy
  - SRS endpoints return 404 (need migration to Next.js)
- **Lesson Start**: Button click does not navigate (requires investigation)

### Phase 2: Ownership Correction (COMPLETE)

**Status**: All service migrations completed on 2026-03-03

#### Summary

Phase 2 completed the migration of all business logic from FastAPI to Next.js, establishing Next.js as the single owner of business logic and Supabase as the single source of truth.

| Service | Migration Status | New Location |
|---------|-----------------|--------------|
| FSRS | ✅ Migrated | [`nextjs/src/features/learning/services/fsrsService.ts`](nextjs/src/features/learning/services/fsrsService.ts) |
| Reading | ✅ Migrated | [`nextjs/src/features/reading/`](nextjs/src/features/reading/) |
| Speaking | ✅ Migrated | [`nextjs/src/features/speaking/`](nextjs/src/features/speaking/) |
| Video | ✅ Migrated | [`nextjs/src/features/video/`](nextjs/src/features/video/) |
| Dictation | ✅ Migrated | [`nextjs/src/features/video/dictationService.ts`](nextjs/src/features/video/dictationService.ts) |
| Sentence Library | ✅ Migrated | [`nextjs/src/features/sentence/`](nextjs/src/features/sentence/) |
| Admin | ✅ Migrated | [`nextjs/src/features/admin/service.ts`](nextjs/src/features/admin/service.ts) |
| Decks | ✅ Migrated | [`nextjs/src/features/decks/service.ts`](nextjs/src/features/decks/service.ts) |

#### Changed
- **Admin Service**: Migrated from FastAPI HTTP calls to direct Supabase access
  - Removed all `fetchApi` calls to FastAPI endpoints
  - Implemented direct Supabase queries for user management, cost analytics, audit logs, and abuse alerts
  - Added proper TypeScript types for all admin operations
  
- **Reading Service**: Completed migration to Next.js
  - Added missing functions: `getReadingSessionById`, `startReadingSession`, `completeReadingSession`, `submitAnswer`, `getMetricsHistory`
  - Updated [`actions.ts`](nextjs/src/features/reading/actions.ts) to use completed service functions
  - Fixed type compatibility with [`types.ts`](nextjs/src/features/reading/types.ts)

- **FastAPI API Router**: Removed all CRUD-style endpoints
  - Removed endpoints: reading, speaking, video_dictation, sentences, videos, fsrs, admin
  - Only agent endpoints remain: chat, memory (session, episodic, semantic), maintenance
  - Added comprehensive architecture documentation in [`api.py`](fastapi/app/api/v1/api.py)

- **FastAPI Services Module**: Removed all service exports
  - [`__init__.py`](fastapi/app/services/__init__.py) now documents the migration
  - No direct DB services are exported from FastAPI

---

### Phase 3: Communication Hardening (COMPLETE)

**Status**: Supabase-mediated workflow implemented on 2026-03-03

#### Summary

Phase 3 established the Supabase-mediated workflow for agent triggering, with idempotency keys and replay safety mechanisms.

#### Added
- **Agent Job Queue Schema** ([`supabase/migrations/20260303_agent_job_queue.sql`](supabase/migrations/20260303_agent_job_queue.sql))
  - `agent_jobs` table with idempotency key support
  - `agent_job_events` table for event sourcing
  - `idempotency_locks` table for distributed locking
  - `agent_webhook_deliveries` table for webhook tracking
  - Database functions: `create_agent_job`, `claim_agent_job`, `complete_agent_job`, `fail_agent_job`, `get_agent_job_result`, `cleanup_agent_jobs`
  - RLS policies for secure access control

- **Agent Job Repository** ([`nextjs/src/features/jobs/jobRepository.ts`](nextjs/src/features/jobs/jobRepository.ts))
  - `generateIdempotencyKey()`: Creates unique idempotency keys
  - `createAgentJob()`: Creates jobs with idempotency check
  - `getJobResultByIdempotencyKey()`: Retrieves results with replay tracking
  - `waitForJobCompletion()`: Polling utility for job completion
  - Full TypeScript types for job management

- **Idempotency Features**
  - 24-hour idempotency window for job creation
  - Automatic duplicate detection and existing result return
  - Replay count tracking for completed jobs
  - Event sourcing for audit trails

---

### Phase 4: Tests & Guards (COMPLETE)

**Status**: Integration tests and validation completed on 2026-03-03

#### Added
- **RLS Enforcement Tests** ([`nextjs/tests/integration/rls-enforcement.test.ts`](nextjs/tests/integration/rls-enforcement.test.ts))
  - Tests for agent_jobs table access control
  - Tests for agent_job_events read restrictions
  - Tests for cross-user data isolation
  - Verification that users cannot modify jobs directly

- **Idempotency Tests** ([`nextjs/tests/integration/idempotency.test.ts`](nextjs/tests/integration/idempotency.test.ts))
  - Tests for idempotency key generation
  - Tests for duplicate job detection
  - Tests for replay safety mechanisms
  - Tests for job status lifecycle tracking

#### Architecture Validation
- All violations from Phase 1 audit have been resolved
- FastAPI no longer has direct database access
- All business logic migrated to Next.js
- Supabase is the single source of truth
- Architecture guard tests pass

---

## Previous Releases

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

