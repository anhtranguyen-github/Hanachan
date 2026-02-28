# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **ISSUES.md** - Documentation of all fixed issues
- **Configuration validation** - Startup validation for required config fields (OPENAI_API_KEY, SUPABASE_URL, SUPABASE_KEY, DB_PASSWORD)
- **Configurable rate limiting** - RATE_LIMIT_PER_MINUTE environment variable
- **Environment file override** - ENV_FILE environment variable for container deployments
- **Persistent speaking practice** - Database-backed sessions and attempts tracking for speaking practice
- **Speaking practice stats** - Aggregate statistics reporting for historical user practice
- **Authentication Bypass Fix** - Introduced `SUPABASE_SERVICE_KEY` to prevent administrative access via public anon keys
- **XSS Protection** - Integrated `isomorphic-dompurify` in Next.js to sanitize dynamic HTML in Reading, Grammar, and Rich Text components
- **API Auth Hardening** - Secured `sentences` endpoints and ensured all learning modules require authentication

### Changed
- Consolidated issue fix comments from source files to ISSUES.md
- Refactored config.py to use Pydantic validators for list fields
- Updated rate_limit.py to use direct attribute access
- **Speaking API** - Refactored endpoints to use persistent database storage instead of in-memory dictionaries
- **CSP Headers** - Strict Content-Security-Policy implemented in next.config.js (removed `'unsafe-eval'`)
- **Rate Limiting** - Expanded rate limiting to Reading, Speaking, and Video Dictation stateful endpoints

### Fixed
- Environment file path resolution for Docker/container deployments
- Rate limit configuration now uses settings instead of hardcoded values
- **SQL Hardening** - Implemented strict column whitelisting for dynamic SQL updates in reading configuration
- **Session Cleanup** - Added session status tracking to replace unbounded in-memory storage

### Security
- **API Schema Hardening** - Implemented strict Pydantic validation (UUIDs, Literal types, and numerical constraints) across Speaking, Reading, Video Dictation, and Sentence Annotation modules.
- **Path Parameter Validation** - Updated all session and exercise endpoints to use native UUID path parameter validation in FastAPI.
- **Auth Dependency Optimization** - Refactored statistical endpoints to use correct authentication dependencies, resolving redundant parameter checks.
- **Input Constraints** - Added length and value range constraints to all practice session inputs to prevent malformed data injection.
- **Docker Build Security** - Integrated **Docker Scout** vulnerability scanning on Pull Requests.
- **Supply Chain Security** - Enabled **SLSA Provenance** and **SBOM** generation for all published Docker images.

### DevOps
- **Dockerfile Optimization** - Refactored FastAPI Dockerfile for better layer caching and secure non-root operation.
- **Image Hardening** - Removed unnecessary build artifacts and enforced non-privileged user (appuser/nextjs) across the stack.
- **Health Monitoring** - Added native Docker healthchecks for both FastAPI and Next.js services.
- **Build Context Efficiency** - Optimized `.dockerignore` to reduce image build times and context size.

## [1.0.0] - 2026-02-27

### Added
- **JWT Authentication** - RS256 token verification for Supabase-issued tokens
- **CORS Restrictions** - Explicit origin list instead of wildcard
- **Rate Limiting** - SlowAPI with per-IP limits and trusted proxy support
- **Database Connection Pooling** - ThreadedConnectionPool for PostgreSQL
- **Parallel Memory Retrieval** - ThreadPoolExecutor for concurrent memory fetches
- **Advisory Locks** - PostgreSQL advisory locks for consolidation
- **Structured JSON Logging** - Request-ID middleware for log correlation
- **Global Exception Handler** - Safe error messages without internal details
- **Request Body Size Limit** - MaxBodySizeMiddleware (64KB)
- **Hard Startup Failure** - App fails if DB is unavailable
- **LLM Timeout Configuration** - Central factory with timeouts
- **User ID Validation** - UUID validation in ChatRequest schema

### Security
- CORS restricted to explicit origins (no wildcard with credentials)
- JWT uses RS256 (asymmetric) with JWKS
- Rate limiting with trusted proxy support
- Input validation on user_id (UUID) and message (max_length)

### Performance
- Parallel memory retrieval using ThreadPoolExecutor
- Background executor for session title/summary generation
- Database connection pooling

### Reliability
- Graceful degradation for optional services (Qdrant, Neo4j)
- Hard startup failure if required services unavailable
- Proper exception handling with correlation IDs
