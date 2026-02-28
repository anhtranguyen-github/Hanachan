"""
Sentence Annotator Service

Matches vocabulary and kanji from knowledge_units against a Japanese sentence,
writing position-based annotations to sentence_knowledge.

Grammar detection is intentionally left as a TODO for a future dedicated service.
"""

from __future__ import annotations

import logging
from typing import List, Dict, Any, Tuple

from ..core.database import execute_query, get_db

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
    rows = execute_query(
        "SELECT id, character FROM knowledge_units "
        "WHERE type = 'vocabulary' AND character IS NOT NULL AND character != '' "
        "ORDER BY length(character) DESC"
    )
    lookup: Dict[str, Dict[str, Any]] = {}
    for r in (rows or []):
        char = r["character"]
        if char not in lookup:  # keep first (longest wins if dupes)
            lookup[char] = {"id": str(r["id"]), "type": "vocabulary"}
    return lookup


def _load_kanji_lookup() -> Dict[str, Dict[str, Any]]:
    """Load all kanji KUs keyed by single character."""
    rows = execute_query(
        "SELECT id, character FROM knowledge_units "
        "WHERE type = 'kanji' AND character IS NOT NULL AND length(character) = 1"
    )
    lookup: Dict[str, Dict[str, Any]] = {}
    for r in (rows or []):
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

    Grammar detection: TODO — will be a separate service.
    """
    logger.info(f"Annotating sentence {sentence_id}: {japanese_raw[:50]}...")

    # Load lookups
    vocab_lookup = _load_vocab_lookup()
    kanji_lookup = _load_kanji_lookup()

    logger.info(f"Loaded {len(vocab_lookup)} vocab, {len(kanji_lookup)} kanji for matching")

    # Match
    annotations = _match_sentence(japanese_raw, vocab_lookup, kanji_lookup)
    logger.info(f"Found {len(annotations)} annotations for sentence {sentence_id}")

    if not annotations:
        return []

    # Write to sentence_knowledge (upsert to handle re-annotation)
    with get_db() as conn:
        with conn.cursor() as cur:
            # Clear old annotations for this sentence
            cur.execute(
                "DELETE FROM sentence_knowledge WHERE sentence_id = %s",
                (sentence_id,)
            )

            # Insert new annotations
            for ann in annotations:
                cur.execute(
                    "INSERT INTO sentence_knowledge (sentence_id, ku_id, position_start, position_end) "
                    "VALUES (%s, %s, %s, %s) "
                    "ON CONFLICT (sentence_id, ku_id) DO UPDATE "
                    "SET position_start = EXCLUDED.position_start, position_end = EXCLUDED.position_end",
                    (sentence_id, ann.ku_id, ann.start, ann.end),
                )

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
    rows = execute_query(
        "SELECT sk.ku_id, sk.position_start, sk.position_end, "
        "       ku.type AS ku_type, ku.character, ku.slug "
        "FROM sentence_knowledge sk "
        "JOIN knowledge_units ku ON ku.id = sk.ku_id "
        "WHERE sk.sentence_id = %s "
        "ORDER BY sk.position_start",
        (sentence_id,)
    )
    return [
        {
            "ku_id": str(r["ku_id"]),
            "ku_type": r["ku_type"],
            "character": r["character"],
            "slug": r["slug"],
            "position_start": r["position_start"],
            "position_end": r["position_end"],
        }
        for r in (rows or [])
    ]
