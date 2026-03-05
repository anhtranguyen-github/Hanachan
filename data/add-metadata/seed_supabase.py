import json
import os
import uuid
import psycopg2
import re
from psycopg2.extras import execute_values, Json
from dotenv import load_dotenv

# Load env from nextjs/.env
load_dotenv("/home/tra01/project/hanachan_v2_final/nextjs/.env")

DATABASE_URL = os.getenv("DATABASE_URL")

def get_db():
    return psycopg2.connect(DATABASE_URL)

def generate_id(slug):
    NAMESPACE = uuid.UUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')
    return str(uuid.uuid5(NAMESPACE, slug))

def extract_text(content):
    """Helper to extract plain text from WaniKani's HTML or nested block structure."""
    if not content:
        return ""
    if isinstance(content, str):
        # Remove HTML tags
        return re.sub(r'<[^>]+>', '', content).strip()
    if isinstance(content, list):
        text_parts = []
        for block in content:
            if isinstance(block, dict) and 'content' in block:
                # Handle nested content blocks
                if isinstance(block['content'], list):
                    for sub in block['content']:
                        if isinstance(sub, dict) and 'content' in sub:
                            text_parts.append(str(sub['content']))
                        else:
                            text_parts.append(str(sub))
                else:
                    text_parts.append(str(block['content']))
        return " ".join(text_parts).strip()
    return str(content)

def seed_data():
    base_path = "/home/tra01/project/hanachan_v2_final/data"
    
    # Store records in dicts to deduplicate
    ku_records = {} # ku_id -> data
    radical_records = {} # ku_id -> data
    kanji_records = {} # ku_id -> data
    vocab_records = {} # ku_id -> data
    grammar_records = {} # ku_id -> data
    
    # Relationships
    kanji_radicals = set()
    vocab_kanji = set()
    grammar_relations = set()
    
    slug_to_id = {}
    radical_name_to_id = {}
    radical_char_to_id = {}

    # Helper to add item to list/dict safely
    def add_ku(ku_id, slug, k_type, level, jlpt, character, meaning):
        if ku_id not in ku_records:
             ku_records[ku_id] = (ku_id, slug, k_type, level, jlpt, character, meaning)
             slug_to_id[slug] = ku_id

    # 1. Process Radicals
    radicals_file = os.path.join(base_path, "radicals.json")
    if os.path.exists(radicals_file):
        print("Reading Radicals...")
        with open(radicals_file, 'r', encoding='utf-8') as f:
            rads = json.load(f)
            for r in rads:
                slug = f"radical_{r['name'].lower().replace(' ', '_')}"
                ku_id = generate_id(slug)
                char = r.get('character') or r.get('name')
                
                add_ku(ku_id, slug, 'radical', r['level'], None, char, r['meaning'])
                
                radical_name_to_id[r['name'].lower()] = ku_id
                if r.get('character'):
                    radical_char_to_id[r['character']] = ku_id

                mnemonic = extract_text(r.get('mnemonic'))
                
                radical_records[ku_id] = (ku_id, mnemonic, r.get('mnemonic_image', {}).get('src'))

    # 2. Process Kanji
    kanji_file = os.path.join(base_path, "kanji.jsonl")
    if os.path.exists(kanji_file):
        print("Reading Kanji...")
        with open(kanji_file, 'r', encoding='utf-8') as f:
            for line in f:
                data = json.loads(line)
                char = data['character']
                slug = f"kanji_{char}"
                ku_id = generate_id(slug)
                
                primary_meaning = data['meanings']['primary'][0] if data['meanings']['primary'] else "Unknown"
                add_ku(ku_id, slug, 'kanji', data['level'], None, char, primary_meaning)
                
                kanji_records[ku_id] = (
                    ku_id, 
                    data['readings'].get('onyomi', []),
                    data['readings'].get('kunyomi', []),
                    extract_text(data['meanings'].get('mnemonic')),
                    extract_text(data['readings'].get('mnemonic'))
                )
                
                # Rel: Radicals (Will be linked in pass 2)

    # 3. Process Vocabulary
    vocab_file = os.path.join(base_path, "vocab.jsonl")
    if os.path.exists(vocab_file):
        print("Reading Vocabulary...")
        with open(vocab_file, 'r', encoding='utf-8') as f:
            for line in f:
                data = json.loads(line)
                char = data['character']
                slug = f"vocab_{char}"
                ku_id = generate_id(slug)
                
                primary_meaning = data['meanings']['primary'][0] if data['meanings']['primary'] else "Unknown"
                add_ku(ku_id, slug, 'vocabulary', data['level'], None, char, primary_meaning)
                
                audio_url = None
                if data['readings'].get('audio'):
                    audio_url = data['readings']['audio'][0]['url']
                
                vocab_records[ku_id] = (
                    ku_id,
                    data['readings'].get('primary', ''),
                    audio_url,
                    data['meanings'].get('word_types', []),
                    Json(data.get('readings', {}).get('pitch_accent', [])), # Add pitch accent
                    extract_text(data['meanings'].get('explanation')),
                    Json(data.get('context_sentences', [])) # Add context sentences
                )

    # 4. Process Grammar
    grammar_file = os.path.join(base_path, "grammar/grammar_full_data.jsonl")
    if os.path.exists(grammar_file):
        print("Reading Grammar...")
        with open(grammar_file, 'r', encoding='utf-8') as f:
            for line in f:
                data = json.loads(line)
                grammar_slug = data['url'].split('/')[-1]
                slug = f"grammar_{grammar_slug}"
                ku_id = generate_id(slug)
                
                jlpt_str = data.get('level', '')
                jlpt = None
                if 'JLPT' in jlpt_str:
                    try: jlpt = int(jlpt_str.replace('JLPT', ''))
                    except: pass

                add_ku(ku_id, slug, 'grammar', 0, jlpt, data['title'], data['meaning'])
                
                explanation = "\n\n".join([w['body'] for w in data.get('about', []) if 'body' in w])
                
                grammar_records[ku_id] = (
                    ku_id,
                    Json(data.get('structure', {})),
                    explanation,
                    data.get('nuance', {}).get('en'),
                    data.get('details', {}).get('caution'),
                    Json(data.get('details', {}).get('supplemental_links', [])),
                    Json(data.get('examples', []))
                )

    # Second pass for relationships
    print("Processing relationships...")
    if os.path.exists(kanji_file):
        with open(kanji_file, 'r', encoding='utf-8') as f:
            for line in f:
                data = json.loads(line)
                k_id = generate_id(f"kanji_{data['character']}")
                for rad_obj in data.get('radicals', []):
                    # Handle objects instead of strings
                    name = rad_obj.get('name', '').lower()
                    char = rad_obj.get('character')
                    rad_id = radical_char_to_id.get(char) or radical_name_to_id.get(name)
                    if rad_id:
                        kanji_radicals.add((k_id, rad_id))

    if os.path.exists(vocab_file):
        with open(vocab_file, 'r', encoding='utf-8') as f:
            for line in f:
                data = json.loads(line)
                v_id = generate_id(f"vocab_{data['character']}")
                for c_obj in data.get('components', []):
                    c_char = c_obj.get('character')
                    k_slug = f"kanji_{c_char}"
                    if k_slug in slug_to_id:
                        vocab_kanji.add((v_id, slug_to_id[k_slug]))

    if os.path.exists(grammar_file):
        with open(grammar_file, 'r', encoding='utf-8') as f:
            for line in f:
                data = json.loads(line)
                g_id = generate_id(f"grammar_{data['url'].split('/')[-1]}")
                for rel_type in ['synonyms', 'antonyms', 'related']:
                    for r in data.get(rel_type, []):
                        r_slug = r.get('slug')
                        if r_slug:
                            target_slug = f"grammar_{r_slug}"
                            if target_slug in slug_to_id:
                                r_type = 'synonym' if rel_type == 'synonyms' else ('antonym' if rel_type == 'antonyms' else 'similar')
                                grammar_relations.add((g_id, slug_to_id[target_slug], r_type, r.get('comparison')))

    # DATABASE CONNECTION
    print(f"Connecting to database...")
    conn = get_db()
    cur = conn.cursor()
    
    try:
        print(f"Upserting {len(ku_records)} Knowledge Units...")
        execute_values(cur, """
            INSERT INTO public.knowledge_units (id, slug, type, level, jlpt, character, meaning)
            VALUES %s
            ON CONFLICT (slug) DO UPDATE SET
            type = EXCLUDED.type,
            level = EXCLUDED.level,
            jlpt = EXCLUDED.jlpt,
            character = EXCLUDED.character,
            meaning = EXCLUDED.meaning
        """, list(ku_records.values()))
        
        print(f"Upserting {len(radical_records)} Radical Details...")
        execute_values(cur, "INSERT INTO public.radical_details (ku_id, meaning_mnemonic, image_url) VALUES %s ON CONFLICT (ku_id) DO UPDATE SET meaning_mnemonic = EXCLUDED.meaning_mnemonic, image_url = EXCLUDED.image_url", list(radical_records.values()))
        
        print(f"Upserting {len(kanji_records)} Kanji Details...")
        execute_values(cur, "INSERT INTO public.kanji_details (ku_id, onyomi, kunyomi, meaning_mnemonic, reading_mnemonic) VALUES %s ON CONFLICT (ku_id) DO UPDATE SET onyomi = EXCLUDED.onyomi, kunyomi = EXCLUDED.kunyomi, meaning_mnemonic = EXCLUDED.meaning_mnemonic, reading_mnemonic = EXCLUDED.reading_mnemonic", list(kanji_records.values()))
        
        print(f"Upserting {len(vocab_records)} Vocabulary Details...")
        execute_values(cur, """
            INSERT INTO public.vocabulary_details (ku_id, reading, audio_url, parts_of_speech, pitch_accent, meaning_mnemonic, context_sentences) 
            VALUES %s 
            ON CONFLICT (ku_id) DO UPDATE SET 
            reading = EXCLUDED.reading, 
            audio_url = EXCLUDED.audio_url, 
            parts_of_speech = EXCLUDED.parts_of_speech, 
            pitch_accent = EXCLUDED.pitch_accent,
            meaning_mnemonic = EXCLUDED.meaning_mnemonic,
            context_sentences = EXCLUDED.context_sentences
        """, list(vocab_records.values()))
        
        print(f"Upserting {len(grammar_records)} Grammar Details...")
        execute_values(cur, "INSERT INTO public.grammar_details (ku_id, structure, explanation, nuance, cautions, external_links, example_sentences) VALUES %s ON CONFLICT (ku_id) DO UPDATE SET structure = EXCLUDED.structure, explanation = EXCLUDED.explanation, nuance = EXCLUDED.nuance, cautions = EXCLUDED.cautions, external_links = EXCLUDED.external_links, example_sentences = EXCLUDED.example_sentences", list(grammar_records.values()))
        
        print(f"Seeding {len(kanji_radicals)} Kanji-Radical links...")
        execute_values(cur, "INSERT INTO public.kanji_radicals (kanji_id, radical_id) VALUES %s ON CONFLICT DO NOTHING", list(kanji_radicals))
        
        print(f"Seeding {len(vocab_kanji)} Vocab-Kanji links...")
        execute_values(cur, "INSERT INTO public.vocabulary_kanji (vocab_id, kanji_id) VALUES %s ON CONFLICT DO NOTHING", list(vocab_kanji))
        
        print(f"Seeding {len(grammar_relations)} Grammar relations...")
        execute_values(cur, "INSERT INTO public.grammar_relations (grammar_id, related_id, type, comparison_note) VALUES %s ON CONFLICT DO NOTHING", list(grammar_relations))
        
        conn.commit()
        print("\n🎉 SUCCESS: All data seeded successfully from root files!")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ FATAL ERROR: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    seed_data()
