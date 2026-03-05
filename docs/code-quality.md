# Code Quality and Architecture Enforcement

This repository implements a strict quality guard system to ensure the codebase remains clean, secure, and architecturally correct.

## Core Rules

1.  **No Relative Imports**: Only absolute imports are allowed. This prevents confusion and keeps the module structure clear.
2.  **No Hardcoded URLs/Routes**: Business logic should not contain hardcoded strings like `http://`, `/api/v1/`, etc. Use configuration or constants.
3.  **No Secrets in Repo**: API keys, tokens, and credentials must never be committed. We use `detect-secrets` to prevent this.
4.  **No Mock Data in Production**: Placeholder strings like "John Doe" or "test@example.com" are banned outside test directories.
5.  **No Debug Artifacts**: `print()`, `console.log`, and temporary comments like `TODO` or `FIXME` are not allowed in production code.
6.  **Architecture Boundaries**: We enforce a strict layer dependency rule: `api → agents → domain → infra`.
    -   `domain` cannot depend on `api` or `agents`.
    -   `agents` cannot access database modules directly.
    -   `api` cannot access vector database clients directly.

## Running Checks Locally

You can run the full suite using:

```bash
./scripts/quality-check.sh
```

This script runs:
- **Ruff**: Linting, formatting, and import rules.
- **Bandit**: Security vulnerability scanning.
- **detect-secrets**: Scanning for committed credentials.
- **Custom Scanners**: Scanning for hardcoded strings, mock data, and debug artifacts.
- **Import Linter**: Enforcing architectural boundaries.

## Pre-commit Hooks

We use `pre-commit` to run these checks automatically before every commit. Install it using:

```bash
pre-commit install
```

## Fixing Violations

- **Imports**: Change `from ..utils import x` to `from app.utils import x`.
- **Hardcoded Strings**: Move URLs and routes to environment variables or a central `config.py`.
- **Secrets**: If a secret is detected, rotate it immediately and add the violation to `.secrets.baseline` only if it's a false positive.
- **Mock Data**: Replace placeholders with real logic or configuration-driven values.
- **Debug Artifacts**: Replace `print()` with `logger.info()` or appropriate logging levels.
- **Architecture**: If `import-linter` fails, you are likely violating the dependency direction. Refactor to use proper interfaces/ports.
