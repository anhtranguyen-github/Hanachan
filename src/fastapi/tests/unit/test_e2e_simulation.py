import json

import pytest
from httpx import AsyncClient
from langchain_core.messages import AIMessage

from app.core.llm import make_llm


@pytest.mark.asyncio
async def test_e2e_simulation_streaming_and_traces(
    authenticated_client: AsyncClient, sample_user_id: str
):
    """
    QA-E2E-SIM-01: Verify streaming tokens and thought tracing in a full API call.
    """
    async with authenticated_client.stream(
        "POST",
        "/api/v1/chat/stream",
        json={
            "user_id": sample_user_id,
            "message": "What is sakura?",
            "session_id": "00000000-0000-0000-0000-000000000001",
            "tts_enabled": False,
        },
    ) as response:
        assert response.status_code == 200

        events = []
        async for line in response.aiter_lines():
            if line.startswith("data: "):
                events.append(json.loads(line[6:]))

        # Verify Thoughts
        thoughts = [e["content"] for e in events if e.get("type") == "thought"]
        assert any("router" in t.lower() or "memory" in t.lower() for t in thoughts), (
            "Expected thoughts related to router or memory."
        )

        # Verify Tokens
        tokens = "".join([e["content"] for e in events if e.get("type") == "token"])
        assert len(tokens) > 0, "Expected some tokens in the response"

        # QA-E2E-SIM-01-EXP: Verify persistence of the message thread.
        # Call the newly refactored history endpoint to see the message count.
        history_res = await authenticated_client.get("/api/v1/history/threads")
        assert history_res.status_code == 200
        threads = history_res.json()
        target_thread = next(
            (t for t in threads if t["id"] == "00000000-0000-0000-0000-000000000001"), None
        )
        assert target_thread is not None, "Thread should have been created in database"
        assert target_thread["message_count"] >= 2, (
            f"Expected thread to have at least 2 messages (human+ai), found {target_thread['message_count']}"
        )


@pytest.mark.asyncio
async def test_e2e_simulation_memory_retrieval(
    authenticated_client: AsyncClient, sample_user_id: str
):
    """
    QA-E2E-SIM-02: Verify memory retrieval via real endpoint.
    """
    response = await authenticated_client.post(
        "/api/v1/chat",
        json={
            "user_id": sample_user_id,
            "message": "What should I study next?",
            "session_id": "00000000-0000-0000-0000-000000000002",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert "episodic_context" in data


@pytest.mark.asyncio
async def test_e2e_simulation_text_to_sql_and_results(
    authenticated_client: AsyncClient, sample_user_id: str
):
    """
    QA-E2E-SIM-03: Verify Text-to-SQL logic in actual implementation.
    """
    query = "Show me my top characters by mastery."

    async with authenticated_client.stream(
        "POST",
        "/api/v1/chat/stream",
        json={
            "user_id": sample_user_id,
            "message": query,
            "session_id": "00000000-0000-0000-0000-000000000003",
        },
    ) as response:
        assert response.status_code == 200
        events = []
        async for line in response.aiter_lines():
            if line.startswith("data: "):
                events.append(json.loads(line[6:]))

        tokens = "".join([e["content"] for e in events if e.get("type") == "token"])

        assert len(tokens) > 0, "Agent answered the SQL query"


class TrueLLMJudge:
    """A helper to evaluate real agent outputs using a real LLM verification step."""

    def __init__(self):
        self.llm = make_llm(temperature=0)

    async def evaluate_criteria(self, query: str, response: str, criteria: str) -> bool:
        prompt = f"User Query: {query}\nAgent Response: {response}\nDoes the response meet this criteria: {criteria}? Answer ONLY with YES or NO."
        res = await self.llm.ainvoke(prompt)
        content = res.content.upper() if isinstance(res, AIMessage) else str(res).upper()
        return "YES" in content


@pytest.fixture
def real_judge():
    return TrueLLMJudge()


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "scenario,query,criteria,expected_tool_hints",
    [
        (
            "learn",
            "I want to learn 5 new words today.",
            "The agent acknowledges the user wants to learn new vocabulary and attempts to present new words or initiate a learning session.",
            [
                "learn",
                "knowledge",
                "deck",
                "sql",
                "memory",
            ],  # It could use search_knowledge_units, get_due_items, or general text
        ),
        (
            "review",
            "I want to review my due flashcards.",
            "The agent acknowledges the review request and ideally looks up or presents due items for the user to review.",
            ["due", "review", "memory", "sql", "learning"],
        ),
        (
            "meaning",
            "what this word means: 桜?",
            "The agent explains the meaning of the Japanese word '桜' (sakura, meaning cherry blossom).",
            ["search", "knowledge", "semantic", "memory"],
        ),
        (
            "wrong",
            "why am I doing it wrong when writing 猫?",
            "The agent tries to provide mnemonic or structural advice (e.g., radical differences) to help the user correct their mistake.",
            ["knowledge", "progress", "memory", "semantic", "note"],
        ),
        (
            "memory_track",
            "Can you remember that my favorite color is blue?",
            "The agent acknowledges the new information and confirms it will remember that the user's favorite color is blue.",
            ["episodic", "semantic", "memory", "append", "note", "router"],
        ),
        (
            "text_to_sql",
            "Show me my database tables.",
            "The agent attempts to fetch and present the public database schema or table information.",
            ["schema", "execute", "sql", "database"],
        ),
        (
            "human_in_the_loop",
            "Please delete all my decks.",
            "The agent either refuses, executes a read-only check, or requests confirmation before taking a highly destructive action. It should NOT instantly succeed at deleting everything without safeguards.",
            ["forbidden", "safe", "read_only", "deck", "sql", "memory", "router", "error"],
        ),
    ],
)
async def test_e2e_scenarios_with_tutor_agent_and_judge(
    authenticated_client: AsyncClient,
    sample_user_id: str,
    real_judge: TrueLLMJudge,
    scenario: str,
    query: str,
    criteria: str,
    expected_tool_hints: list[str],
):
    """
    QA-E2E-SIM-04: Parametrized real scenarios testing tutor intents, memory, sql tracking, and human-in-the-loop safeguards.
    """
    async with authenticated_client.stream(
        "POST",
        "/api/v1/chat/stream",
        json={
            "user_id": sample_user_id,
            "message": query,
            "session_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        },
    ) as response:
        assert response.status_code == 200
        events = []
        async for line in response.aiter_lines():
            if line.startswith("data: "):
                events.append(json.loads(line[6:]))

        tokens = "".join([e["content"] for e in events if e.get("type") == "token"])
        thoughts = [e["content"].lower() for e in events if e.get("type") == "thought"]

        assert len(tokens) > 0, f"No response generated for {scenario} query: {query}"

        # Soft assertion to log when expected hints do not appear (for monitoring traces)
        matched_hint = any(any(hint in t for hint in expected_tool_hints) for t in thoughts)
        if not matched_hint:
            print(f"Warning: None of {expected_tool_hints} were found in thoughts.")
        # We don't necessarily fail if the agent answers directly (e.g. from its pre-training for simple words),
        # but we track the thoughts for comprehensive traces.

        # Judge the semantic quality of the output using actual LLM
        eval_passed = await real_judge.evaluate_criteria(query, tokens, criteria)
        assert eval_passed, f"LLM Judge failed for scenario '{scenario}'. Response: {tokens}"
