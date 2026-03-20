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
