"""
Seed subjects from data/ directory into local Supabase.
Reads: radicals.json, kanji_full_data.jsonl, vocab_full_data.jsonl, grammar_full_data.jsonl
Writes: public.subjects + public.subject_details
"""
from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

from supabase import create_client

# ── Config ────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"

SUPABASE_URL = os.getenv("SUPABASE_URL", "http://127.0.0.1:54421")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

BATCH_SIZE = 200  # Supabase upsert batch size


def _slug(type_: str, char: str) -> str:
    """Generate a stable slug: type_character."""
    safe = re.sub(r"[^\w\u3000-\u9fff\u30a0-\u30ff\u3040-\u309f]+", "_", char).strip("_")
    return f"{type_}_{safe}" if safe else f"{type_}_unknown"


def _primary_meaning(meanings_obj) -> str:
    """Extract the primary meaning from various data shapes."""
    if isinstance(meanings_obj, dict):
        primary = meanings_obj.get("primary", [])
        if isinstance(primary, list) and primary:
            return primary[0]
        return str(primary) if primary else "Unknown"
    if isinstance(meanings_obj, str):
        return meanings_obj
    return "Unknown"


def _alt_meanings(meanings_obj) -> list:
    if isinstance(meanings_obj, dict):
        return meanings_obj.get("alternatives", [])
    return []


# ── Loaders ───────────────────────────────────────────────────

def load_radicals() -> list[dict]:
    path = DATA / "radicals" / "radicals.json"
    if not path.exists():
        path = DATA / "radicals.json"
    if not path.exists():
        print(f"  ⚠ Radicals file not found at {path}")
        return []

    raw = json.loads(path.read_text("utf-8"))
    subjects, details = [], []

    for r in raw:
        char = r.get("character", "")
        slug = _slug("radical", r.get("slug") or r.get("name") or char)
        meaning = r.get("meaning") or r.get("name") or "Unknown"
        level = r.get("level", 0)

        mnemonic_text = ""
        mn = r.get("mnemonic", [])
        if isinstance(mn, list):
            for block in mn:
                if isinstance(block, dict):
                    content = block.get("content", [])
                    if isinstance(content, list):
                        for c in content:
                            if isinstance(c, dict):
                                mnemonic_text += c.get("content", "")
                            elif isinstance(c, str):
                                mnemonic_text += c
                    elif isinstance(content, str):
                        mnemonic_text += content

        subjects.append({
            "slug": slug,
            "type": "radical",
            "characters": char or None,
            "level": level,
            "meanings": [{"meaning": meaning, "primary": True}],
            "meaning_primary": meaning,
            "readings": [],
            "meaning_mnemonic": mnemonic_text or None,
            "lesson_position": 0,
        })
        details.append({
            "slug": slug,  # temp key for linking
            "image_url": (r.get("mnemonic_image") or {}).get("src"),
            "metadata": json.dumps({"url": r.get("url", ""), "kanji_slugs": r.get("kanji_slugs", [])}),
        })

    return list(zip(subjects, details))


def load_kanji() -> list[tuple[dict, dict]]:
    path = DATA / "kanji" / "kanji_full_data.jsonl"
    if not path.exists():
        print(f"  ⚠ Kanji file not found at {path}")
        return []

    results = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            r = json.loads(line)
            char = r.get("character", "")
            slug = _slug("kanji", char)
            meanings = r.get("meanings", {})
            primary = _primary_meaning(meanings)
            level = r.get("level", 0)

            readings_data = r.get("readings", {})
            readings_list = []
            for rt in ["onyomi", "kunyomi", "nanori"]:
                for reading in readings_data.get(rt, []):
                    if reading and reading != "None":
                        readings_list.append({"reading": reading, "type": rt, "primary": rt == "onyomi"})

            subjects = {
                "slug": slug,
                "type": "kanji",
                "characters": char,
                "level": level,
                "meanings": json.dumps([{"meaning": primary, "primary": True}] +
                                       [{"meaning": m, "primary": False} for m in _alt_meanings(meanings)]),
                "meaning_primary": primary,
                "readings": json.dumps(readings_list),
                "meaning_mnemonic": meanings.get("mnemonic"),
                "reading_mnemonic": readings_data.get("mnemonic"),
                "lesson_position": 0,
            }
            detail = {
                "slug": slug,
                "onyomi": [r for r in readings_data.get("onyomi", []) if r != "None"],
                "kunyomi": [r for r in readings_data.get("kunyomi", []) if r != "None"],
                "nanori": [r for r in readings_data.get("nanori", []) if r != "None"],
                "reading_hint": readings_data.get("hint"),
                "meaning_hint": meanings.get("hint"),
                "metadata": json.dumps({
                    "url": r.get("url", ""),
                    "radicals": r.get("radicals", []),
                    "visually_similar": r.get("visually_similar", []),
                    "amalgamations": r.get("amalgamations", []),
                }),
            }
            results.append((subjects, detail))
    return results


def load_vocab() -> list[tuple[dict, dict]]:
    path = DATA / "vocab" / "vocab_full_data.jsonl"
    if not path.exists():
        print(f"  ⚠ Vocab file not found at {path}")
        return []

    results = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            r = json.loads(line)
            char = r.get("character", "")
            slug = _slug("vocabulary", char)
            meanings = r.get("meanings", {})
            primary = _primary_meaning(meanings)
            level = r.get("level", 0)

            readings_data = r.get("readings", {})
            primary_reading = readings_data.get("primary", "")
            readings_list = [{"reading": primary_reading, "primary": True}] if primary_reading else []

            pos = meanings.get("part_of_speech", [])
            if isinstance(pos, str):
                pos = [pos]

            audio_list = readings_data.get("audio", [])

            subjects = {
                "slug": slug,
                "type": "vocabulary",
                "characters": char,
                "level": level,
                "meanings": json.dumps([{"meaning": primary, "primary": True}] +
                                       [{"meaning": m, "primary": False} for m in _alt_meanings(meanings)]),
                "meaning_primary": primary,
                "readings": json.dumps(readings_list),
                "meaning_mnemonic": meanings.get("mnemonic"),
                "reading_mnemonic": readings_data.get("mnemonic"),
                "lesson_position": 0,
            }
            detail = {
                "slug": slug,
                "reading_primary": primary_reading,
                "parts_of_speech": pos,
                "context_sentences": json.dumps(r.get("context_sentences", [])),
                "pronunciation_audios": json.dumps(audio_list),
                "metadata": json.dumps({
                    "url": r.get("url", ""),
                    "components": r.get("components", []),
                }),
            }
            results.append((subjects, detail))
    return results


def load_grammar() -> list[tuple[dict, dict]]:
    path = DATA / "grammar" / "grammar_full_data.jsonl"
    if not path.exists():
        print(f"  ⚠ Grammar file not found at {path}")
        return []

    # Map JLPT level strings to integers
    jlpt_map = {"JLPT5": 5, "JLPT4": 4, "JLPT3": 3, "JLPT2": 2, "JLPT1": 1}

    results = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            r = json.loads(line)
            title = r.get("title", "")
            slug = _slug("grammar", title)
            meaning = r.get("meaning", "Unknown")
            level_str = r.get("level", "")
            jlpt = jlpt_map.get(level_str, None)
            # Use a numeric level based on grammar id for ordering
            grammar_id = r.get("id", 0)
            level = max(1, grammar_id // 50 + 1)  # rough grouping

            nuance = r.get("nuance", {})
            details_data = r.get("details", {})

            subjects = {
                "slug": slug,
                "type": "grammar",
                "characters": title,
                "level": level,
                "jlpt": jlpt,
                "meanings": [{"meaning": meaning, "primary": True}],
                "meaning_primary": meaning,
                "readings": [],
                "meaning_mnemonic": None,
                "lesson_position": grammar_id,
            }
            detail = {
                "slug": slug,
                "structure": json.dumps(r.get("structure", {})),
                "explanation": nuance.get("en"),
                "nuance": nuance.get("ja"),
                "cautions": details_data.get("caution"),
                "external_links": json.dumps(details_data.get("supplemental_links", [])),
                "example_sentences": json.dumps(r.get("examples", [])),
                "metadata": json.dumps({
                    "url": r.get("url", ""),
                    "grammar_id": grammar_id,
                    "register": details_data.get("register"),
                    "part_of_speech": details_data.get("part_of_speech"),
                }),
            }
            results.append((subjects, detail))
    return results


# ── Upserter ──────────────────────────────────────────────────

def upsert_batch(client, table: str, rows: list[dict], on_conflict: str = "slug"):
    """Upsert rows in batches."""
    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i : i + BATCH_SIZE]
        client.table(table).upsert(batch, on_conflict=on_conflict).execute()
        print(f"    ↳ {table}: upserted {min(i + BATCH_SIZE, len(rows))}/{len(rows)}")


def seed():
    print("━━━ Hanachan: Seeding Subjects ━━━")
    client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Load all data
    print("\n→ Loading radicals...")
    radical_pairs = load_radicals()
    print(f"  Found {len(radical_pairs)} radicals")

    print("→ Loading kanji...")
    kanji_pairs = load_kanji()
    print(f"  Found {len(kanji_pairs)} kanji")

    print("→ Loading vocabulary...")
    vocab_pairs = load_vocab()
    print(f"  Found {len(vocab_pairs)} vocab")

    print("→ Loading grammar...")
    grammar_pairs = load_grammar()
    print(f"  Found {len(grammar_pairs)} grammar")

    all_pairs = radical_pairs + kanji_pairs + vocab_pairs + grammar_pairs
    print(f"\n→ Total subjects: {len(all_pairs)}")

    # Phase 1: Upsert subjects
    print("\n→ Upserting subjects...")
    # Deduplicate by slug to avoid "ON CONFLICT DO UPDATE command cannot affect row a second time"
    subject_rows = []
    seen_slugs = set()
    for pair in all_pairs:
        row = pair[0]
        if row["slug"] not in seen_slugs:
            subject_rows.append(row)
            seen_slugs.add(row["slug"])
        else:
            print(f"  ⚠ Duplicate slug found and skipped: {row['slug']}")
            
    upsert_batch(client, "subjects", subject_rows)

    # Phase 2: Fetch IDs by slug for linking details
    print("\n→ Fetching subject IDs...")
    slug_to_id = {}
    # Fetch in batches of 1000
    offset = 0
    while True:
        res = client.table("subjects").select("id, slug").range(offset, offset + 999).execute()
        if not res.data:
            break
        for row in res.data:
            slug_to_id[row["slug"]] = row["id"]
        offset += 1000
        if len(res.data) < 1000:
            break

    print(f"  Mapped {len(slug_to_id)} subject IDs")

    # Phase 3: Upsert subject_details
    print("\n→ Upserting subject details...")
    detail_rows = []
    seen_ids = set()
    for subj, detail in all_pairs:
        slug = detail.pop("slug", subj["slug"])
        sid = slug_to_id.get(slug)
        if sid and sid not in seen_ids:
            detail["subject_id"] = sid
            detail_rows.append(detail)
            seen_ids.add(sid)

    # Upsert in batches
    for i in range(0, len(detail_rows), BATCH_SIZE):
        batch = detail_rows[i : i + BATCH_SIZE]
        client.table("subject_details").upsert(batch, on_conflict="subject_id").execute()
        print(f"    ↳ subject_details: upserted {min(i + BATCH_SIZE, len(detail_rows))}/{len(detail_rows)}")

    print(f"\n✅ Seeded {len(all_pairs)} subjects + {len(detail_rows)} details")


if __name__ == "__main__":
    try:
        seed()
    except Exception as e:
        print(f"\n❌ Seeding failed: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
