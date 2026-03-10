from typing import Any

from langchain_core.messages import SystemMessage

from app.core.llm import make_llm


class AgentJudge:
    """
    Utility class to use an LLM as a judge for evaluating agent behaviors.
    """

    def __init__(self):
        import os

        from langchain.chat_models import ChatOpenAI

        judge_key = os.environ.get("LLM_JUDGE_API_KEY")
        if judge_key and "sk-test-key" not in judge_key:
            self.llm = ChatOpenAI(model="gpt-4o", temperature=0, openai_api_key=judge_key)
        else:
            self.llm = make_llm(temperature=0)

    async def judge_explanation_quality(
        self, user_input: str, agent_output: str, user_level: str = "N5"
    ) -> dict[str, Any]:
        """
        Evaluates if the agent's explanation is appropriate for the user's JLPT level.
        """
        judge_prompt = f"""
        You are an AI Integration Expert. 
        Evaluate if the AI Agent successfully utilized retrieved context or memory to answer the user's query.
        
        USER INPUT: "{user_input}"
        AGENT RESPONSE: "{agent_output}"
        
        CRITERIA:
        1. Context Usage (accuracy_score): Did the agent's response incorporate information that implies it successfully retrieved the relevant context/memory (e.g., past conversations, user notes)? Give a score from 1-5, where 4-5 means the context is clearly integrated.
        2. Relevance (level_score): Was the response relevant and helpful for the user's input? Give a score from 1-5.
        3. Warning (warning_detected): Did the agent fulfill any special constraints or issue warnings if applicable? (true/false)
        
        Respond ONLY in JSON format:
        {{
            "accuracy_score": int,
            "level_score": int,
            "warning_detected": bool,
            "reasoning": "string"
        }}
        """

        response = await self.llm.ainvoke([SystemMessage(content=judge_prompt)])
        import json

        try:
            # Basic cleanup if LLM wraps in markdown
            content = response.content.replace("```json", "").replace("```", "").strip()
            return json.loads(content)
        except Exception:
            return {"error": "Failed to parse judge output", "raw": response.content}

    async def judge_thought_process(self, user_input: str, thoughts: list[str]) -> dict[str, Any]:
        """
        Evaluates if the agent's internal thought process is logical and efficient.
        """
        thought_trace = "\n".join([f"- {t}" for t in thoughts])
        judge_prompt = f"""
        You are an AI Architect. Evaluate the internal "thoughts" of an agent graph.
        
        USER INPUT: "{user_input}"
        INTERNAL THOUGHTS:
        {thought_trace}
        
        CRITERIA:
        1. Logic: Does the sequence of thoughts follow a logical path to solve the user's request? (Score 1-5)
        2. Tool Selection: Did the thoughts mention appropriate tools if needed? (Score 1-5)
        3. Conciseness: Are the thoughts focused on the task without unnecessary noise? (Score 1-5)
        
        Respond ONLY in JSON format:
        {{
            "logic_score": int,
            "tool_score": int,
            "conciseness_score": int,
            "feedback": "string"
        }}
        """

        response = await self.llm.ainvoke([SystemMessage(content=judge_prompt)])
        import json

        try:
            content = response.content.replace("```json", "").replace("```", "").strip()
            return json.loads(content)
        except Exception:
            return {"error": "Failed to parse judge output", "raw": response.content}


class MockAgentJudge:
    """Mock version of AgentJudge for unit testing without API costs."""

    async def judge_explanation_quality(self, **kwargs):
        return {
            "accuracy_score": 5,
            "level_score": 5,
            "warning_detected": True,
            "reasoning": "Mock evaluation: Perfect.",
        }

    async def judge_thought_process(self, **kwargs):
        return {
            "logic_score": 5,
            "tool_score": 5,
            "conciseness_score": 5,
            "feedback": "Mock evaluation: Excellent logic.",
        }
