# SQL Agents in LangChain: Tutorials and Best Practices

A SQL Agent lets an LLM securely construct syntax to read relational schemas, auto-recover from structural query failures, and answer organic questions directly against a SQL engine.

## Tutorial

### Installation
```bash
uv pip install -U langchain langchain-community langchain-openai langchainhub langgraph sqlite3 requests sqlalchemy
```

### Setup `SQLDatabaseToolkit` & Engine Bindings

```python
from langchain_community.utilities import SQLDatabase
from langchain_openai import ChatOpenAI
from langchain_community.agent_toolkits import SQLDatabaseToolkit
from langchain import hub
from langchain.agents import create_tool_calling_agent, AgentExecutor
from sqlalchemy import create_engine

# Engine connection pointing at your SQLite / PSQL driver path
engine = create_engine("sqlite:///my_local_chinook.db")
db = SQLDatabase(engine)

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
toolkit = SQLDatabaseToolkit(db=db, llm=llm)
```

### Agent Orchestration
Deploy a tool-calling LangGraph style loop.

```python
tools = toolkit.get_tools()
prompt_template = hub.pull("langchain-ai/sql-agent-system-prompt")

system_message = prompt_template.format(
    dialect=db.dialect.upper(),
    top_k=15 # Security & Data ceiling limit
)

agent = create_tool_calling_agent(llm, tools, system_message)
agent_executor = AgentExecutor(
    agent=agent, 
    tools=tools, 
    handle_parsing_errors=True, 
    max_iterations=15
)

# Execute
results = agent_executor.invoke({"input": "What are the top 5 longest tracks?"})
```

## Best Practices
1. **Security (Read-Only)**: Unequivocally ensure the database user executing the connection string operates under a 100% read-only permission matrix targeting an isolated subset schema to prevent data manipulation or loss.
2. **Targeted Table Delivery**: Use `db.get_table_info_no_throw(['only', 'these', 'tables'])` to filter and expose only explicit domain tables if the schema is large to prevent LLM hallucination and context-window exhaustion. 
3. **Dialect Grounding**: Strictly hardcode the correct dialect in the LangChain hub prompt `format()` layer (Postgres, SQLite, MySQL) so syntax mappings are properly scoped.
4. **Few-Shot Examples**: Inject 2-4 known accurate "User Statement ↔ Valid SQL Mapping" templates manually into the system context.
5. **Tool-Calling Over ReAct**: Always utilize `create_tool_calling_agent` for complex DB manipulations with modern LLMs (avoid legacy ReAct pipelines), as modern endpoints are explicitly mapped to emit tool signatures perfectly for query executions.

## Repo-specific: Safe executor and HITL

This repository provides a small safe-execution helper to enforce SELECT-only, parameterized queries and require table whitelisting, plus a human-in-the-loop wrapper for approval before executing agent-produced SQL.

Usage example (internal utilities):

```python
from src.fastapi.app.utils.safe_sql import do_execute
from src.fastapi.app.utils.hitl import execute_with_approval

# execute safely (requires SAFE_SQL_TABLES env or explicit whitelist)
rows = do_execute(DB_URL, "SELECT id, name FROM users WHERE id = :id", {"id": user_id}, table_whitelist={"users"})

# human-in-the-loop approval flow
def approver(proposed):
    # show proposed to a reviewer via UI/CLI and return {"type":"approve"} or {"type":"reject","message":"..."}
    return {"type": "approve"}

rows = execute_with_approval(DB_URL, "SELECT * FROM users WHERE email = :e", {"e": email}, table_whitelist={"users"}, approver=approver)
```

Notes:
- The safe executor rejects non-SELECT statements and queries referencing tables not in the configured whitelist.
- Prefer tool-calling (LangChain) + these helpers over formatting SQL strings directly.

## Failure Modes & Mitigations

This section lists realistic failure modes for the SQL agent flow and concrete mitigations (how we've implemented or recommend handling them).

- Wrong SQL dialect emitted by the LLM
    - Symptom: syntax errors from the DB (e.g., `LIMIT` vs `TOP`, identifier quoting).
    - Mitigation: ground the dialect in the system prompt (`prompt_template.format(dialect=...)`), use dialect-specific tools, and validate SQL via a parsing/compile step before execution.

- Malformed SQL or LLM hallucinated columns/tables
    - Symptom: parse errors, missing table/column errors at execution time.
    - Mitigation: use `SQLDatabaseToolkit` introspection to present only whitelisted tables/columns to the LLM; validate generated tool args and run `AgentExecutor` parsing checks. At runtime, the safe executor rejects queries that reference non-whitelisted tables.

- SQL injection / dynamic string formatting
    - Symptom: unsafe concatenated strings leading to injected predicates or DML.
    - Mitigation: enforce parameterized queries (`text()` + parameter dict) and reject any queries containing multiple statements or suspicious string concatenation patterns. Prefer tool-calling interfaces that expose typed parameters instead of raw SQL strings.

- Excessive data / expensive queries
    - Symptom: long-running queries, large result payloads, DB resource pressure.
    - Mitigation: enforce `top_k`/row limits in prompts and at validation, add a hard row-cap in the safe executor, and require human approval for queries that exceed configured thresholds.

- Unauthorized access or privilege escalation
    - Symptom: queries that should be blocked return unexpected results or produce permission errors.
    - Mitigation: use a read-only DB user with least-privilege and RLS policies where possible; enforce table whitelists at the tool/validator layer; log all proposed executions for audit.

- Live DB side effects from agent mistakes
    - Symptom: accidental DML/DCL execution modifying production data.
    - Mitigation: disallow non-SELECT statements entirely in the safe executor; require explicit, human-approved, tightly-scoped escalation path (out-of-band process) to enable write access.

- Human-in-the-loop delays and stale context
    - Symptom: long approval times lead to stale assumptions in agent state or dropped sessions.
    - Mitigation: include the proposed query, intended intent, and a short TTL in the approval payload; if the TTL expires, require the agent to regenerate the request.

- Network/DB timeouts
    - Symptom: transient failures, partial results, or long waits.
    - Mitigation: set conservative DB timeouts, retry idempotent read queries with backoff, and surface clear error messages to the user. Instrument and alert on increased timeout rates.

- LLM produces ambiguous or underspecified tool args
    - Symptom: tool call missing required parameters or using defaults unsafely.
    - Mitigation: require strict tool schemas in the agent (typed signatures), run validation middleware that enforces required fields and acceptable value ranges before invoking the executor.

- Logging and observability gaps
    - Symptom: inability to audit who approved/ran which query or to trace failures.
    - Mitigation: log proposed queries, approver decisions, execution results, and DB errors to a centralized audit log with retention policies. Wire these logs into alerting dashboards.

Repository implementations:
- `src/fastapi/app/utils/safe_sql.py` — SELECT-only, parameterized executor with table whitelist and simple table extraction/validation.
- `src/fastapi/app/utils/hitl.py` — approval wrapper that accepts an `approver` callback and enforces explicit approve/reject decisions before execution.

Recommended next steps to harden production:
1. Enforce `SAFE_SQL_TABLES` via environment or runtime config and fail closed when not set.
2. Add a row-cap and execution-time budget to `do_execute`.
3. Integrate a persistent approval UI/service that records approver identity and TTLs; wire `execute_with_approval` to use it.
4. Add automated integration tests that run agent -> toolkit -> validator -> HITL -> safe executor against a CI-postgres instance.

