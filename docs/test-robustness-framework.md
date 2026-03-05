# Test Robustness Validation Framework

## Overview

This framework ensures tests **actually validate behavior** and are not merely written to pass. It implements automated verification loops that detect weak, ineffective, or fake tests.

## Core Principle

> **Tests must prove they can fail when the system is wrong.**

The framework continuously challenges tests through:
1. **Mutation Testing** - Code mutations to verify test detection
2. **Contract Violation** - API contract breaches to verify integration tests
3. **Negative Testing** - Invalid inputs to verify error handling
4. **Assertion Analysis** - Detection of weak/trivial assertions
5. **Red-Green Verification** - Confirmation that tests fail when they should

---

## Components

### 1. Mutation Testing

#### TypeScript/JavaScript (Stryker)
**Configuration:** [`nextjs/stryker.config.json`](../nextjs/stryker.config.json)

**Threshold:** 70% minimum mutation score

**Usage:**
```bash
cd nextjs
pnpm test:mutation        # Run mutation testing
pnpm test:mutation:ci     # Run with CI reporters
```

**What it does:**
- Introduces small code changes (mutations)
- Runs tests against mutated code
- Verifies tests fail when code is changed
- Generates HTML/JSON reports

**Mutation operators include:**
- Arithmetic operators (`+` → `-`)
- Boolean logic (`&&` → `||`)
- Comparison operators (`>` → `<`)
- String mutations
- Array/operator mutations

**Example output:**
```
Mutation Score: 75%
Killed: 150 (75%)
Survived: 50 (25%)
Timeout: 0 (0%)
```

If score < 70%, CI fails.

#### Python (mutmut)
**Configuration:** [`fastapi-domain/pyproject.toml`](../fastapi-domain/pyproject.toml)

**Usage:**
```bash
cd fastapi-domain
uv run mutmut run --paths-to-mutate="app/" --tests-dir="tests/"
uv run mutmut results    # View results
```

---

### 2. Contract Violation Simulation

**Tests:** [`nextjs/tests/api/contract-drift.test.ts`](../nextjs/tests/api/contract-drift.test.ts)

**What it validates:**
- API endpoints exist as expected
- Response schemas match contracts
- Required fields are present
- OpenAPI specification is valid

**Verification script:** [`scripts/verify-contract.py`](../scripts/verify-contract.py)

**Usage:**
```bash
python scripts/verify-contract.py openapi/domain.json
```

---

### 3. Negative Test Injection

Tests verify APIs properly reject:
- Invalid payloads
- Missing required fields
- Malformed requests
- Edge case inputs
- Invalid authentication

**Implementation:** Handled by existing integration tests with invalid data scenarios.

---

### 4. Assertion Strength Analysis

**Automated Detection:** CI pipeline scans for weak assertions:

**Bad patterns flagged:**
```typescript
// Weak - only checks status
expect(response.status).toBe(200);

// Weak - trivial assertion
expect(data).toBeDefined();
expect(result).toBeTruthy();
```

**Strong assertions encouraged:**
```typescript
// Strong - validates data
expect(response.data.user_id).toBe(expectedId);
expect(response.data.role).toBe("admin");
expect(response.data.permissions).toContain("write");
```

---

### 5. Red-Green Verification Loop

**Concept:** Verify tests follow TDD Red-Green cycle:
1. **Red Phase:** Break code intentionally, tests MUST fail
2. **Green Phase:** Fix code, tests MUST pass

**Coverage via:** Mutation testing automatically validates this.

---

### 6. Test Isolation Verification

**Checks for:**
- Tests depending on previous tests
- Shared mutable state
- Database leftovers
- Hidden dependencies

**Detection:** CI analyzes test files for:
- Global variables in tests
- Missing beforeEach/afterEach
- Large test files (>500 lines)

---

## CI Integration

### Workflow: [`.github/workflows/test-robustness.yml`](../.github/workflows/test-robustness.yml)

**Pipeline stages:**

```
┌─────────────────────────────────────────────────────────────┐
│                    Test Robustness Verification              │
├─────────────────────────────────────────────────────────────┤
│ 1. Mutation Testing                                          │
│    ├─ Stryker (TypeScript) → 70% threshold                  │
│    └─ mutmut (Python) → analyze results                      │
├─────────────────────────────────────────────────────────────┤
│ 2. Contract Violation Tests                                  │
│    └─ Verify API contracts don't drift                       │
├─────────────────────────────────────────────────────────────┤
│ 3. Test Quality Analysis                                     │
│    └─ Detect weak assertions                                 │
├─────────────────────────────────────────────────────────────┤
│ 4. Summary Report                                            │
│    └─ Comprehensive test robustness metrics                  │
└─────────────────────────────────────────────────────────────┘
```

**Triggers:**
- Push to main/develop
- Pull requests
- Daily scheduled run (2 AM)
- Manual dispatch

### Manual Verification Script

**Script:** [`scripts/test-robustness.sh`](../scripts/test-robustness.sh)

**Usage:**
```bash
# Run all checks
./scripts/test-robustness.sh all

# Run specific check
./scripts/test-robustness.sh mutation
./scripts/test-robustness.sh contract
./scripts/test-robustness.sh assertion
./scripts/test-robustness.sh red-green
./scripts/test-robustness.sh isolation
```

**Output:**
- Console progress
- JSON report
- Detailed logs in `reports/test-robustness/`

---

## Configuration

### Stryker Configuration (TypeScript)

```json
{
  "packageManager": "pnpm",
  "testRunner": "vitest",
  "coverageAnalysis": "perTest",
  "mutate": ["src/**/*.ts", "!src/**/*.d.ts", "!src/client/**"],
  "thresholds": {
    "high": 80,
    "low": 60,
    "break": 70
  }
}
```

### mutmut Configuration (Python)

```toml
[tool.mutmut]
paths_to_mutate = "app/"
tests_dir = "tests/"
mutate_covered_only = true
show_mutants = true
```

---

## Interpretation of Results

### Mutation Score

| Score | Status | Action |
|-------|--------|--------|
| 90%+ | Excellent | Tests are highly effective |
| 80-89% | Good | Minor improvements possible |
| 70-79% | Acceptable | Meet minimum threshold |
| 60-69% | Poor | Add tests for survived mutants |
| <60% | Critical | Significant test gaps |

### Survived Mutants

If a mutant survives, it means:
- No test covers that code path
- Tests don't properly validate the behavior
- The code may be unreachable (dead code)

**Example:**
```typescript
// Original code
function calculateTotal(price: number, quantity: number) {
  return price * quantity;  // Mutated to: price + quantity
}

// Test that would catch this mutation:
test('calculateTotal multiplies price by quantity', () => {
  expect(calculateTotal(10, 2)).toBe(20);  // Would fail with addition
});
```

---

## Preventing Fake Tests

### Anti-Patterns Detected

1. **Always-pass tests**
   - No assertions
   - Assertions that are always true
   - Tests that don't exercise code

2. **Status-only assertions**
   - Only checking HTTP 200
   - Not validating response data

3. **Trivial assertions**
   - `toBeDefined()` on required fields
   - `toBeTruthy()` on non-empty strings
   - Not validating specific values

4. **Missing error cases**
   - No tests for failure scenarios
   - No validation of error responses

### Enforcement

CI fails if any of the following occur:
- Mutation score < 70%
- Contract violations not detected
- Critical weak assertions found
- Tests don't fail when code is mutated

---

## Reports

### Artifacts Generated

1. **stryker-report/** - HTML/JSON mutation testing results
2. **mutmut-reports/** - Python mutation testing logs
3. **contract-test-results/** - API contract validation
4. **quality-report/** - Test quality analysis

### Report Retention

- **Duration:** 30 days
- **Access:** GitHub Actions artifacts
- **Format:** HTML (human-readable) + JSON (machine-readable)

---

## Best Practices

### Writing Testable Code

1. **Pure functions** - Easier to test, fewer mutations survive
2. **Small functions** - Isolated behavior, targeted tests
3. **Dependency injection** - Mock dependencies for unit tests
4. **Avoid global state** - Tests remain isolated

### Writing Effective Tests

1. **Test behavior, not implementation**
   - Focus on what code does, not how
   - Tests should survive refactoring

2. **Assert specific values**
   - Not just `expect(result).toBeDefined()`
   - Use `expect(result).toBe(expectedValue)`

3. **Cover edge cases**
   - Empty inputs
   - Boundary values
   - Error conditions

4. **One assertion per concept**
   - Don't test multiple things in one assertion
   - Clear failure messages

5. **Test the unhappy path**
   - Errors should be tested
   - Invalid inputs should be rejected

---

## Troubleshooting

### Low Mutation Score

**Problem:** Many mutants survive

**Solutions:**
1. Add tests for uncovered code paths
2. Strengthen weak assertions
3. Remove unreachable code
4. Add integration tests for complex logic

### Slow Mutation Testing

**Stryker:**
```bash
# Run on subset of files
pnpm stryker run --mutate "src/core/*.ts"

# Increase timeout
# Edit stryker.config.json: "timeoutMS": 30000
```

**mutmut:**
```bash
# Run on specific module
uv run mutmut run --paths-to-mutate="app/services/"
```

### False Positives

Some mutations may survive for valid reasons:
- Logging statements
- Configuration code
- Debug-only code

**Solution:** Configure mutmut/Stryker to ignore these patterns.

---

## Related Documentation

- [API Integration](api-integration.md) - Contract-driven API development
- [API Migration Guide](api-migration-guide.md) - Migrating to Hey API

---

## References

- [Stryker Mutator](https://stryker-mutator.io/) - JavaScript/TypeScript mutation testing
- [mutmut](https://github.com/boxed/mutmut) - Python mutation testing
- [Mutation Testing Concepts](https://en.wikipedia.org/wiki/Mutation_testing)
