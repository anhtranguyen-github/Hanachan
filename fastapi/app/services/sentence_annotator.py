"""
Sentence Annotator Service

Matches vocabulary and kanji from knowledge_units against a Japanese sentence,
writing position-based annotations to sentence_knowledge.

Grammar detection is intentionally left as a TODO for a future dedicated service.
"""

from __future__ import annotations

import logging
from typing import List, Dict, Any

from app.core.supabase import get_service_client
supabase = get_service_client()

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Types
# ---------------------------------------------------------------------------

class Annotation:
    """A matched KU span within a sentence."""
    __slots__ = ("ku_id", "ku_type", "character", "start", "end")

    def __init__(self, ku_id: str, ku_type: str, character: str, start: int, end: int):
        self.ku_id = ku_id
        self.ku_type = ku_type
        self.character = character
        self.start = start
        self.end = end

    def __repr__(self) -> str:
        return f"Annotation({self.character!r}, {self.start}:{self.end}, {self.ku_type})"


# ---------------------------------------------------------------------------
# KU Cache (loaded once per annotation batch)
# ---------------------------------------------------------------------------

def _load_vocab_lookup() -> Dict[str, Dict[str, Any]]:
    """Load all vocabulary KUs keyed by character, longest first."""
    # We can't do length(character) directly in simple select, but we can fetch and sort
    res = supabase.table("knowledge_units") \
        .select("id, character") \
        .eq("type", "vocabulary") \
        .not_.is_("character", "null") \
        .execute()
    
    rows = res.data or []
    # filter out empty characters
    rows = [r for r in rows if r["character"] != '']
    # sort by length descending
    rows.sort(key=lambda x: len(x["character"]), reverse=True)
    
    lookup: Dict[str, Dict[str, Any]] = {}
    for r in rows:
        char = r["character"]
        if char not in lookup:
            lookup[char] = {"id": str(r["id"]), "type": "vocabulary"}
    return lookup


def _load_kanji_lookup() -> Dict[str, Dict[str, Any]]:
    """Load all kanji KUs keyed by single character."""
    res = supabase.table("knowledge_units") \
        .select("id, character") \
        .eq("type", "kanji") \
        .not_.is_("character", "null") \
        .execute()
    
    rows = res.data or []
    # filter for length 1
    rows = [r for r in rows if len(r["character"]) == 1]
    
    lookup: Dict[str, Dict[str, Any]] = {}
    for r in rows:
        char = r["character"]
        if char not in lookup:
            lookup[char] = {"id": str(r["id"]), "type": "kanji"}
    return lookup


# ---------------------------------------------------------------------------
# Core matching algorithm
# ---------------------------------------------------------------------------

def _match_sentence(
    text: str,
    vocab_lookup: Dict[str, Dict[str, Any]],
    kanji_lookup: Dict[str, Dict[str, Any]],
) -> List[Annotation]:
    """
    Greedy longest-match-first annotation.

    1. Try matching vocabulary (multi-char) at each position, longest first.
    2. For unmatched positions, try matching individual kanji.
    3. Return non-overlapping annotations sorted by position.
    """
    n = len(text)
    covered = [False] * n  # tracks which positions are already annotated
    annotations: List[Annotation] = []

    # Pre-sort vocab keys by length descending for greedy matching
    vocab_keys_sorted = sorted(vocab_lookup.keys(), key=len, reverse=True)

    # Pass 1: Vocabulary (longest match first)
    for vocab_char in vocab_keys_sorted:
        vlen = len(vocab_char)
        start = 0
        while start <= n - vlen:
            if text[start:start + vlen] == vocab_char:
                # Check no overlap with already-covered positions
                if not any(covered[start:start + vlen]):
                    info = vocab_lookup[vocab_char]
                    annotations.append(Annotation(
                        ku_id=info["id"],
                        ku_type=info["type"],
                        character=vocab_char,
                        start=start,
                        end=start + vlen,
                    ))
                    for i in range(start, start + vlen):
                        covered[i] = True
                    start += vlen
                    continue
            start += 1

    # Pass 2: Individual kanji (single characters not yet covered)
    for i in range(n):
        if covered[i]:
            continue
        ch = text[i]
        if ch in kanji_lookup:
            info = kanji_lookup[ch]
            annotations.append(Annotation(
                ku_id=info["id"],
                ku_type=info["type"],
                character=ch,
                start=i,
                end=i + 1,
            ))
            covered[i] = True

    # Sort by position
    annotations.sort(key=lambda a: a.start)
    return annotations


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def annotate_sentence(sentence_id: str, japanese_raw: str) -> List[Dict[str, Any]]:
    """
    Annotate a sentence by matching vocab and kanji from the knowledge_units table.
    Writes results to sentence_knowledge and returns the annotation list.
    """
    logger.info(f"Annotating sentence {sentence_id}: {japanese_raw[:50]}...")

    # Load lookups
    vocab_lookup = _load_vocab_lookup()
    kanji_lookup = _load_kanji_lookup()

    logger.info(f"Loaded {len(vocab_lookup)} vocab, {len(kanji_lookup)} kanji for matching")

    # Match
    annotations = _match_sentence(japanese_raw, vocab_lookup, kanji_lookup)
    logger.info(f"Found {len(annotations)} annotations for sentence {sentence_id}")

    # Clear old annotations
    supabase.table("sentence_knowledge").delete().eq("sentence_id", sentence_id).execute()

    if not annotations:
        return []

    # Insert new annotations
    insert_data = [
        {
            "sentence_id": sentence_id,
            "ku_id": ann.ku_id,
            "position_start": ann.start,
            "position_end": ann.end
        }
        for ann in annotations
    ]
    supabase.table("sentence_knowledge").insert(insert_data).execute()

    # Return structured result
    return [
        {
            "ku_id": a.ku_id,
            "ku_type": a.ku_type,
            "character": a.character,
            "position_start": a.start,
            "position_end": a.end,
        }
        for a in annotations
    ]


def get_sentence_annotations(sentence_id: str) -> List[Dict[str, Any]]:
    """Fetch existing annotations for a sentence."""
    res = supabase.table("sentence_knowledge") \
        .select("ku_id, position_start, position_end, ku:knowledge_units(type, character, slug)") \
        .eq("sentence_id", sentence_id) \
        .order("position_start") \
        .execute()
    
    rows = res.data or []
    return [
        {
            "ku_id": str(r["ku_id"]),
            "ku_type": r["ku"]["type"],
            "character": r["ku"]["character"],
            "slug": r["ku"]["slug"],
            "position_start": r["position_start"],
            "position_end": r["position_end"],
        }
        for r in rows
    ]
