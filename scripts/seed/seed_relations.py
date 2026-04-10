"""
Seed subject relations from data/add-metadata JSON files.
Reads: radical_to_kanji.json, kanji_to_vocab.json, grammar_relationships.json
Writes: public.subject_relations
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

from supabase import create_client

ROOT = Path(__file__).resolve().parents[2]
META = ROOT / "data" / "add-metadata"

SUPABASE_URL = os.getenv("SUPABASE_URL", "http://127.0.0.1:54421")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
BATCH_SIZE = 200


def build_char_to_id(client) -> dict[str, int]:
    """Build character → subject_id lookup from the subjects table."""
    lookup: dict[str, int] = {}
    offset = 0
    while True:
        res = client.table("subjects").select("id, characters, slug, type").range(offset, offset + 999).execute()
        if not res.data:
            break
        for row in res.data:
            if row["characters"]:
                key = f"{row['type']}:{row['characters']}"
                lookup[key] = row["id"]
                # Also add plain character lookup
                lookup[row["characters"]] = row["id"]
            lookup[row["slug"]] = row["id"]
        offset += 1000
        if len(res.data) < 1000:
            break
    return lookup


def seed_relations():
    print("━━━ Hanachan: Seeding Subject Relations ━━━")
    client = create_client(SUPABASE_URL, SUPABASE_KEY)

    print("→ Building character → ID lookup...")
    lookup = build_char_to_id(client)
    print(f"  Mapped {len(lookup)} entries")

    relations = []

    # 1. Radical → Kanji (component relation)
    radical_kanji_file = META / "radical_to_kanji.json"
    if radical_kanji_file.exists():
        data = json.loads(radical_kanji_file.read_text("utf-8"))
        for radical_char, kanji_list in data.items():
            src_id = lookup.get(f"radical:{radical_char}") or lookup.get(radical_char)
            if not src_id:
                continue
            for kanji_char in kanji_list:
                tgt_id = lookup.get(f"kanji:{kanji_char}") or lookup.get(kanji_char)
                if tgt_id:
                    relations.append({
                        "source_subject_id": src_id,
                        "target_subject_id": tgt_id,
                        "relation_type": "component",
                    })
        print(f"  radical→kanji: {len(relations)} relations")

    # 2. Kanji → Vocab (amalgamation)
    kanji_vocab_file = META / "kanji_to_vocab.json"
    prev = len(relations)
    if kanji_vocab_file.exists():
        data = json.loads(kanji_vocab_file.read_text("utf-8"))
        for kanji_char, vocab_list in data.items():
            src_id = lookup.get(f"kanji:{kanji_char}") or lookup.get(kanji_char)
            if not src_id:
                continue
            for vocab_char in vocab_list:
                tgt_id = lookup.get(f"vocabulary:{vocab_char}") or lookup.get(vocab_char)
                if tgt_id:
                    relations.append({
                        "source_subject_id": src_id,
                        "target_subject_id": tgt_id,
                        "relation_type": "amalgamation",
                    })
        print(f"  kanji→vocab: {len(relations) - prev} relations")

    # 3. Grammar synonyms/antonyms/similar
    grammar_file = META / "grammar_relationships.json"
    prev = len(relations)
    if grammar_file.exists():
        data = json.loads(grammar_file.read_text("utf-8"))
        for title, rels in data.items():
            src_id = lookup.get(f"grammar_{title}") or lookup.get(title)
            if not src_id:
                continue
            for syn in rels.get("synonyms", []):
                val = syn.get("title") or syn.get("slug") if isinstance(syn, dict) else syn
                tgt_id = lookup.get(f"grammar_{val}") or lookup.get(val)
                if tgt_id:
                    relations.append({
                        "source_subject_id": src_id,
                        "target_subject_id": tgt_id,
                        "relation_type": "synonym",
                    })
            for ant in rels.get("antonyms", []):
                val = ant.get("title") or ant.get("slug") if isinstance(ant, dict) else ant
                tgt_id = lookup.get(f"grammar_{val}") or lookup.get(val)
                if tgt_id:
                    relations.append({
                        "source_subject_id": src_id,
                        "target_subject_id": tgt_id,
                        "relation_type": "antonym",
                    })
            for rel in rels.get("related", []):
                val = rel.get("title") or rel.get("slug") if isinstance(rel, dict) else rel
                tgt_id = lookup.get(f"grammar_{val}") or lookup.get(val)
                if tgt_id:
                    relations.append({
                        "source_subject_id": src_id,
                        "target_subject_id": tgt_id,
                        "relation_type": "similar",
                    })
        print(f"  grammar relations: {len(relations) - prev} relations")

    # Deduplicate
    seen = set()
    unique = []
    for r in relations:
        key = (r["source_subject_id"], r["target_subject_id"], r["relation_type"])
        if key not in seen:
            seen.add(key)
            unique.append(r)

    print(f"\n→ Upserting {len(unique)} unique relations...")
    for i in range(0, len(unique), BATCH_SIZE):
        batch = unique[i : i + BATCH_SIZE]
        client.table("subject_relations").upsert(
            batch, on_conflict="source_subject_id,target_subject_id,relation_type"
        ).execute()
        print(f"    ↳ {min(i + BATCH_SIZE, len(unique))}/{len(unique)}")

    print(f"\n✅ Seeded {len(unique)} subject relations")


if __name__ == "__main__":
    try:
        seed_relations()
    except Exception as e:
        print(f"\n❌ Seeding failed: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
