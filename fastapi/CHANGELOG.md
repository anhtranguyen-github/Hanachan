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

### Changed
- Consolidated issue fix comments from source files to ISSUES.md
- Refactored config.py to use Pydantic validators for list fields
- Updated rate_limit.py to use direct attribute access

### Fixed
- Environment file path resolution for Docker/container deployments
- Rate limit configuration now uses settings instead of hardcoded values

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
