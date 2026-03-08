QA Scenarios for hanchan

This folder contains automated QA scenarios and helpers for manual QA runs.

Structure:
- `smoke_test.py` - quick smoke checks for main endpoints/views
- `scenario_api_flow.py` - example end-to-end API/flow test
- `scenarios.md` - list of scenarios and how to run them

Run examples:

```bash
# run a single scenario
pytest -q src/fastapi/tests/qa_scenarios/smoke_test.py

# run all QA scenarios
pytest -q src/fastapi/tests/qa_scenarios
```

Notes:
- These tests are examples and use SQLite in-memory for isolation where possible.
- Prefer using `do_execute` / `execute_with_approval` helpers in code that would otherwise run raw SQL.
