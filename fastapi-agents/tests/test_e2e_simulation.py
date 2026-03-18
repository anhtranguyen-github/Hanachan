import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient
from langchain_core.messages import AIMessage, AIMessageChunk, HumanMessage
from langchain_core.runnables import RunnableLambda

from app.agents.memory_agent.nodes.implementation import WorkerDispatch


class LLMJudge:
    """A helper to evaluate agent outputs using an LLM-like interface."""

    def __init__(self, mock_llm: AsyncMock | MagicMock):
        self.llm = mock_llm

    async def evaluate_relevance(self, query: str, retrieved_context: str) -> bool:
        """Evaluate if the retrieved context is relevant to the query."""
        prompt = f"Query: {query}\nContext: {retrieved_context}\nIs this context relevant? Answer YES or NO."
        response = await self.llm.ainvoke(prompt)
        return "YES" in response.content.upper()

    async def evaluate_sql(self, query: str, generated_sql: str) -> bool:
        """Evaluate if the generated SQL matches the intent of the query."""
        prompt = f"Query: {query}\nSQL: {generated_sql}\nDoes this SQL correctly address the query? Answer YES or NO."
        response = await self.llm.ainvoke(prompt)
        return "YES" in response.content.upper()

    async def evaluate_sql_results_quality(self, query: str, sql_results: str, agent_answer: str) -> bool:
        """Evaluate if the agent's answer accurately reflects the SQL results for the given query."""
        prompt = (
            f"Query: {query}\n"
            f"SQL Results Data: {sql_results}\n"
            f"Agent Answer: {agent_answer}\n"
            "Does the agent answer accurately and helpfully explain the SQL results? Answer YES or NO."
        )
        response = await self.llm.ainvoke(prompt)
        return "YES" in response.content.upper()


@pytest.fixture
def judge_llm():
    mock = AsyncMock()
    mock.ainvoke.return_value = AIMessage(content="YES")
    return LLMJudge(mock)


@pytest.mark.asyncio
async def test_e2e_simulation_streaming_and_traces(
    authenticated_client: AsyncClient, sample_user_id: str
):
    """
    QA-E2E-SIM-01: Verify streaming tokens and thought tracing in a full API call.
    """
    responses = {
        "orchestrator": WorkerDispatch(workers=["memory_worker"], reasoning="Checking memory."),
        "worker": AIMessage(content="", tool_calls=[{"name": "get_episodic_memory", "args": {"query": "sakura"}, "id": "c1"}]),
        "reviewer": AIMessage(content="GENERATE"),
        "generator": AIMessage(content="Sakura means cherry blossom."),
    }

    class MockAgentLLM(RunnableLambda):
        def __init__(self):
            super().__init__(func=self._mock_call)
            self.ainvoke = AsyncMock()
            self.invoke = MagicMock()
            self.calls = 0

        def _mock_call(self, *args, **kwargs): return AIMessage(content="...")
        def bind_tools(self, tools): return self
        def with_structured_output(self, schema): return self

        async def _mock_ainvoke_logic(self, *args, **kwargs):
            self.calls += 1
            input_data = args[0] if args else kwargs.get("input")
            prompt_str = str(input_data)
            if "specialized workers" in prompt_str:
                return responses["orchestrator"] if self.calls == 1 else WorkerDispatch(workers=[], reasoning="Done.")
            if "Memory Specialist" in prompt_str:
                return responses["worker"] if self.calls <= 2 else AIMessage(content="Found.")
            return AIMessage(content="...")

        def _mock_invoke_logic(self, *args, **kwargs):
            input_data = args[0] if args else kwargs.get("input")
            prompt_str = str(input_data)
            if "reviewer" in prompt_str or "Decision Rules" in prompt_str: return responses["reviewer"]
            if "warm, and professional" in prompt_str: return responses["generator"]
            return AIMessage(content="...")

    agent_llm = MockAgentLLM()
    agent_llm.ainvoke.side_effect = agent_llm._mock_ainvoke_logic
    agent_llm.invoke.side_effect = agent_llm._mock_invoke_logic

    with (
        patch("app.agents.memory_agent.nodes.implementation.make_llm", return_value=agent_llm),
        patch("app.agents.memory_agent.nodes.workers.make_llm", return_value=agent_llm),
        patch("app.core.llm.make_embedding_model"),
        patch("app.mcp.client.McpClient.call_tool", new_callable=AsyncMock, return_value={}),
        patch("app.services.memory.episodic_memory.search_episodic_memory", return_value=[MagicMock(text="User likes sakura", score=0.9)]),
        patch("app.services.memory.semantic_memory.search_semantic_memory", return_value=[]),
    ):
        async with authenticated_client.stream(
            "POST",
            "/api/v1/chat/stream",
            json={
                "user_id": sample_user_id,
                "message": "What is sakura?",
                "session_id": "sess-e2e",
                "tts_enabled": False,
            },
        ) as response:
            assert response.status_code == 200
            
            events = []
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    events.append(json.loads(line[6:]))

            # Verify Thoughts
            thoughts = [e["content"] for e in events if e["type"] == "thought"]
            assert any("orchestrator" in t.lower() or "checking" in t.lower() or "memory" in t.lower() for t in thoughts)
            
            # Verify Status (Tool Start/End)
            statuses = [e["content"] for e in events if e["type"] == "status"]
            assert any("Calling get_episodic_memory" in s for s in statuses)
            
            # Verify Tokens
            tokens = "".join([e["content"] for e in events if e["type"] == "token"])
            assert "Sakura" in tokens


@pytest.mark.asyncio
async def test_e2e_simulation_memory_retrieval_with_judge(
    authenticated_client: AsyncClient, sample_user_id: str, judge_llm: LLMJudge
):
    """
    QA-E2E-SIM-02: Verify memory retrieval and use LLM judge to check relevance.
    """
    memory_text = "The user mentioned they are studying for JLPT N2 in December."
    
    with (
        patch("app.api.v1.endpoints.chat.run_chat") as mock_run_chat,
    ):
        mock_run_chat.return_value = {
            "response": "Since you are studying for JLPT N2, you should focus on Kanji.",
            "episodic_context": memory_text,
            "semantic_context": "",
            "thread_context": "",
        }

        response = await authenticated_client.post(
            "/api/v1/chat",
            json={
                "user_id": sample_user_id,
                "message": "What should I study next?",
                "session_id": "sess-mem",
            },
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "episodic_context" in data
        retrieved = data["episodic_context"]
        
        # 2. Use LLM Judge to verify relevance
        is_relevant = await judge_llm.evaluate_relevance(
            query="What should I study next?",
            retrieved_context=retrieved
        )
        
        assert is_relevant is True
        assert "JLPT N2" in retrieved


@pytest.mark.asyncio
async def test_e2e_simulation_text_to_sql_and_results_with_judge(
    authenticated_client: AsyncClient, sample_user_id: str, judge_llm: LLMJudge
):
    """
    QA-E2E-SIM-03: Verify Text-to-SQL logic and verify RESULTS quality with LLM judge.
    """
    query = "Show me my top characters by mastery."
    generated_sql = "SELECT character, mastery_level FROM user_mastery WHERE user_id = 'u1' ORDER BY mastery_level DESC LIMIT 5;"
    mock_sql_results = "[{'character': '桜', 'mastery_level': 95}, {'character': '猫', 'mastery_level': 88}]"
    final_answer = "Your top characters are 桜 (95%) and 猫 (88%)."
    
    async def mock_astream_events(*args, **kwargs):
        # 1. SQL Expert node produces thought with SQL
        yield {
            "event": "on_chain_end",
            "name": "sql_worker",
            "data": {"output": {"thought": f"I will query the database: {generated_sql}"}}
        }
        # 2. Tool Trace for SQL execution
        yield {
            "event": "on_tool_start",
            "name": "execute_read_only_sql",
            "data": {"input": {"sql": generated_sql}}
        }
        yield {
            "event": "on_tool_end",
            "name": "execute_read_only_sql",
            "data": {"output": mock_sql_results}
        }
        # 3. Final answer stream
        yield {
            "event": "on_chat_model_stream",
            "data": {"chunk": AIMessageChunk(content=final_answer)}
        }

    with patch(
        "app.api.v1.endpoints.chat.memory_graph.astream_events", side_effect=mock_astream_events
    ):
        async with authenticated_client.stream(
            "POST",
            "/api/v1/chat/stream",
            json={
                "user_id": sample_user_id,
                "message": query,
                "session_id": "sess-sql",
            },
        ) as response:
            assert response.status_code == 200
            events = []
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    events.append(json.loads(line[6:]))
            
            # 1. Extract pieces for final evaluation
            sql_thoughts = [e["content"] for e in events if e["type"] == "thought" and "SELECT" in e["content"]]
            tokens = "".join([e["content"] for e in events if e["type"] == "token"])
            
            # 2. Verify SQL Query Quality
            is_good_sql = await judge_llm.evaluate_sql(
                query=query,
                generated_sql=sql_thoughts[0]
            )
            assert is_good_sql is True
            
            # 3. Verify SQL RESULTS Interpretation Quality
            is_accurate_interpretation = await judge_llm.evaluate_sql_results_quality(
                query=query,
                sql_results=mock_sql_results,
                agent_answer=tokens
            )
            assert is_accurate_interpretation is True
            assert "桜" in tokens
            assert "95" in tokens
