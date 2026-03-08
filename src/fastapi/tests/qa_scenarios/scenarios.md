QA scenarios

1. Smoke test
   - File: `smoke_test.py`
   - Purpose: quickly verify local dev server is up

2. API/DB flow
   - File: `scenario_api_flow.py`
   - Purpose: example end-to-end flow using in-memory DB and the `execute_with_approval` helper

3. Manual checklist
   - Use the `qa` skill guidance for manual QA runs and evidence collection

How to run

```bash
pytest -q src/fastapi/tests/qa_scenarios
```
