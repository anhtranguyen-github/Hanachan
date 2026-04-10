QA scenarios

1. Smoke test
   - File: `smoke_test.py`
   - Purpose: quickly verify local dev server is up

2. API/DB flow
   - File: `scenario_api_flow.py`
   - Purpose: example end-to-end flow using in-memory DB and the `execute_with_approval` helper

3. FSRS learn/review flow
   - File: `test_fsrs_learn_review.py`
   - Purpose: verify chat-study learn and review flows can prepare a card, persist session state, and submit FSRS progress

4. Manual checklist
   - Use the `qa` skill guidance for manual QA runs and evidence collection

How to run

```bash
pytest -q src/fastapi/tests/qa_scenarios
```
