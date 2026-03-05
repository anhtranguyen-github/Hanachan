import json
import os
from collections import defaultdict

def process_metadata():
    base_path = "/home/tra01/project/hanachan_v2_final/data"
    output_path = os.path.join(base_path, "add-metadata")
    os.makedirs(output_path, exist_ok=True)

    # 1. Kanji mappings
    kanji_to_vocab = defaultdict(set)
    vocab_to_kanji = defaultdict(set)
    kanji_to_radicals = defaultdict(set)
    radical_to_kanji = defaultdict(set)
    levels_kanji = defaultdict(list)
    levels_vocab = defaultdict(list)
    levels_grammar = defaultdict(list)

    # Load Kanji data
    kanji_file = os.path.join(base_path, "kanji/kanji_full_data.jsonl")
    if os.path.exists(kanji_file):
        with open(kanji_file, 'r', encoding='utf-8') as f:
            for line in f:
                data = json.loads(line)
                char = data.get('character')
                if not char: continue
                
                # Levels
                lvl = str(data.get('level', 'unknown'))
                levels_kanji[lvl].append(char)
                
                # Radicals
                rads = data.get('radicals', [])
                for r in rads:
                    kanji_to_radicals[char].add(r)
                    radical_to_kanji[r].add(char)
                
                # Kanji to Vocab (from amalgamations field in kanji data)
                vocabs = data.get('amalgamations', [])
                for v in vocabs:
                    kanji_to_vocab[char].add(v)
                    vocab_to_kanji[v].add(char)

    # Load Vocab data (to fill gaps and get components)
    vocab_file = os.path.join(base_path, "vocab/vocab_full_data.jsonl")
    if os.path.exists(vocab_file):
        with open(vocab_file, 'r', encoding='utf-8') as f:
            for line in f:
                data = json.loads(line)
                char = data.get('character')
                if not char: continue
                
                # Levels
                lvl = str(data.get('level', 'unknown'))
                levels_vocab[lvl].append(char)
                
                # Components (broken down kanji)
                comps = data.get('components', [])
                for c in comps:
                    vocab_to_kanji[char].add(c)
                    kanji_to_vocab[c].add(char)

    # Load Grammar data
    grammar_file = os.path.join(base_path, "grammar/grammar_full_data.jsonl")
    grammar_relationships = {}
    if os.path.exists(grammar_file):
        with open(grammar_file, 'r', encoding='utf-8') as f:
            for line in f:
                data = json.loads(line)
                title = data.get('title')
                if not title: continue
                
                # Levels
                lvl = str(data.get('level', 'unknown'))
                levels_grammar[lvl].append(title)
                
                # Relationships
                grammar_relationships[title] = {
                    'id': data.get('id'),
                    'synonyms': data.get('synonyms', []),
                    'antonyms': data.get('antonyms', []),
                    'related': data.get('related', [])
                }

    # Helper to convert sets to lists for JSON
    def set_to_list(d):
        return {k: sorted(list(v)) for k, v in d.items()}

    # Save files
    files_to_save = {
        'kanji_to_vocab.json': set_to_list(kanji_to_vocab),
        'vocab_to_kanji.json': set_to_list(vocab_to_kanji),
        'kanji_to_radicals.json': set_to_list(kanji_to_radicals),
        'radical_to_kanji.json': set_to_list(radical_to_kanji),
        'grammar_relationships.json': grammar_relationships,
        'levels_kanji.json': dict(levels_kanji),
        'levels_vocab.json': dict(levels_vocab),
        'levels_grammar.json': dict(levels_grammar)
    }

    for filename, content in files_to_save.items():
        with open(os.path.join(output_path, filename), 'w', encoding='utf-8') as f:
            json.dump(content, f, ensure_ascii=False, indent=2)
            print(f"Saved {filename}")

if __name__ == "__main__":
    process_metadata()
