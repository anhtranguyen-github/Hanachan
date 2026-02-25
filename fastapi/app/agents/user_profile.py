"""
User Profile Module.
"""
from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

from ..services.memory import semantic_memory as sem_mem
from ..core.config import settings
from ..schemas.memory import UserProfile

# ---------------------------------------------------------------------------
# LLM lazy init
# ---------------------------------------------------------------------------

_llm: Optional[ChatOpenAI] = None


def _get_llm() -> ChatOpenAI:
    global _llm
    if _llm is None:
        _llm = ChatOpenAI(
            model=settings.llm_model,
            temperature=0,
            openai_api_key=settings.openai_api_key,
        )
    return _llm


# ---------------------------------------------------------------------------
# Raw graph queries
# ---------------------------------------------------------------------------

def _get_raw_facts(user_id: str) -> List[Dict[str, Any]]:
    """Return all semantic triples for this user."""
    return sem_mem.inspect_semantic_memory(user_id)


def _facts_to_text(facts: List[Dict[str, Any]]) -> str:
    if not facts:
        return "(no structured facts available)"
    lines = []
    for f in facts:
        src = f.get("source", {})
        rel = f.get("relationship", "RELATED_TO")
        tgt = f.get("target", {})
        lines.append(
            f"- ({src.get('id', '?')} [{src.get('type', '?')}]) "
            f"—[{rel}]→ "
            f"({tgt.get('id', '?')} [{tgt.get('type', '?')}])"
        )
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Profile generation
# ---------------------------------------------------------------------------

_PROFILE_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are a user profiling expert. Given a set of facts extracted from "
        "conversations with a user, synthesise a concise structured profile.\n"
        "Return a JSON object with these keys:\n"
        "  name (str|null), preferences (list[str]), goals (list[str]), "
        "interests (list[str]), facts (list[str]).\n"
        "Keep each list to at most 10 items. Return ONLY valid JSON, no markdown.",
    ),
    (
        "human",
        "Facts about user '{user_id}':\n{facts_text}",
    ),
])


def build_user_profile(user_id: str) -> UserProfile:
    """
    Query the semantic graph and synthesise a UserProfile.
    """
    facts = _get_raw_facts(user_id)
    facts_text = _facts_to_text(facts)

    if not facts:
        return UserProfile(
            user_id=user_id,
            name=None,
            preferences=[],
            goals=[],
            interests=[],
            facts=[],
            raw_triples=[],
        )

    try:
        chain = _PROFILE_PROMPT | _get_llm()
        result = chain.invoke({"user_id": user_id, "facts_text": facts_text})
        text = result.content.strip().lstrip("```json").rstrip("```").strip()
        data = json.loads(text)
        return UserProfile(
            user_id=user_id,
            name=data.get("name"),
            preferences=data.get("preferences", []),
            goals=data.get("goals", []),
            interests=data.get("interests", []),
            facts=data.get("facts", []),
            raw_triples=facts,
        )
    except Exception as exc:
        print(f"[user_profile] LLM parse error: {exc}")
        return UserProfile(
            user_id=user_id,
            name=None,
            preferences=[],
            goals=[],
            interests=[],
            facts=[f"{f.get('source',{}).get('id','?')} {f.get('relationship','?')} {f.get('target',{}).get('id','?')}" for f in facts[:20]],
            raw_triples=facts,
        )


def profile_to_system_prompt(profile: UserProfile) -> str:
    """Format a UserProfile as a concise system prompt block for a chatbot."""
    parts = [f"Known information about the user (user_id: {profile.user_id}):"]
    if profile.name:
        parts.append(f"- Name: {profile.name}")
    if profile.preferences:
        parts.append(f"- Preferences: {', '.join(profile.preferences)}")
    if profile.goals:
        parts.append(f"- Goals: {', '.join(profile.goals)}")
    if profile.interests:
        parts.append(f"- Interests: {', '.join(profile.interests)}")
    if profile.facts:
        parts.append("- Additional facts: " + "; ".join(profile.facts[:10]))
    return "\n".join(parts)
