Phase 1: Architectural Safety Remediation - COMPLETE

Eliminate critical architectural violations from FastAPI codebase to align
with "Supabase as Single Source of Truth" principle.

Sub-Phases Completed:
- 1.1: Architecture violations audit (50+ violations cataloged)
- 1.2: ARCHITECTURE_RULES.md created  
- 1.3: Architecture violation detection tests and CI guards
- 1.4: Removed direct PostgreSQL access (psycopg2 removed from core)
- 1.5: Removed JWT authentication from FastAPI (auth moved to Next.js)
- 1.6: Eliminated in-memory state treated as truth (video_dictation fixed)

Breaking Changes:
- FastAPI no longer has direct DB access - Services using get_db_connection()
  will fail with ArchitectureViolationError
- FastAPI no longer validates JWT tokens - Endpoints now accept user_id as
  explicit parameter instead of extracting from JWT
- Direct SQL queries blocked - All data access must go through Supabase

Security Impact:
- All DB access now goes through Supabase RLS (Row Level Security)
- Auth consolidated in BFF layer (Next.js)
- No auth bypass possible in FastAPI (pre-authenticated requests only)

Files Created:
- documentation/ARCHITECTURE_VIOLATIONS_AUDIT.md
- documentation/ARCHITECTURE_RULES.md
- documentation/PHASE_1_6_IN_MEMORY_STATE_AUDIT.md
- fastapi-agents/tests/test_architecture_violations.py
- scripts/architecture-guard.py
- .github/workflows/architecture-guard.yml

Files Modified:
- fastapi-agents/app/core/database.py (DELETED)
- fastapi-agents/app/core/config.py (DB settings removed)
- fastapi-agents/app/main.py (DB/auth initialization removed)
- fastapi-agents/app/core/security.py (JWT validation removed)
- fastapi-agents/app/core/admin_security.py (Admin auth removed)
- fastapi-agents/app/api/v1/endpoints/*.py (all 12 files - JWT deps removed)
- fastapi-agents/app/services/video_dictation.py (in-memory state removed)
- fastapi-agents/requirements.txt (psycopg2 removed)
- fastapi-agents/pyproject.toml (psycopg2 removed)
- fastapi-agents/tests/test_security.py (tests updated)

Closes: Phase 1 architectural remediation
