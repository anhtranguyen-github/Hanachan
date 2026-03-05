import json
import os

def validate_grammar_data(file_path):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    stats = {
        'total_records': 0,
        'missing_id': 0,
        'missing_title': 0,
        'missing_meaning': 0,
        'missing_level': 0,
        'missing_nuance': 0,
        'missing_structure': 0,
        'missing_details': 0,
        'missing_about': 0,
        'missing_examples': 0,
        'empty_synonyms': 0,
        'empty_antonyms': 0,
    }

    print(f"Validating {file_path}...")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        for i, line in enumerate(f):
            stats['total_records'] += 1
            try:
                data = json.loads(line)
            except json.JSONDecodeError:
                print(f"Line {i+1}: Invalid JSON")
                continue

            if not data.get('id'): stats['missing_id'] += 1
            if not data.get('title'): stats['missing_title'] += 1
            if not data.get('meaning'): stats['missing_meaning'] += 1
            if not data.get('level'): stats['missing_level'] += 1
            
            if not data.get('nuance', {}).get('en'): stats['missing_nuance'] += 1
            
            struct = data.get('structure', {})
            if not struct.get('casual') and not struct.get('polite'):
                stats['missing_structure'] += 1
            
            if not data.get('details'): stats['missing_details'] += 1
            if not data.get('about'): stats['missing_about'] += 1
            
            exs = data.get('examples', [])
            if not exs:
                stats['missing_examples'] += 1
            else:
                # Check at least one example has valid data
                if not any(e.get('japanese_html') for e in exs):
                    stats['missing_examples'] += 1

            if not data.get('synonyms'): stats['empty_synonyms'] += 1
            if not data.get('antonyms'): stats['empty_antonyms'] += 1

    print("\n--- Grammar Validation Results ---")
    if stats['total_records'] == 0:
        print("No records found.")
        return

    for key, val in stats.items():
        percentage = (val / stats['total_records'] * 100)
        print(f"{key:30}: {val:5} ({percentage:6.2f}%)")
    
    serious_issues = ['missing_id', 'missing_title', 'missing_meaning', 'missing_level']
    has_issues = any(stats[key] > 0 for key in serious_issues)
    
    print("\nConclusion: " + ("Issues found in critical fields!" if has_issues else "Data looks healthy."))

if __name__ == "__main__":
    path = "/home/tra01/project/hanachan_v2_final/data/grammar/grammar_full_data.jsonl"
    validate_grammar_data(path)
