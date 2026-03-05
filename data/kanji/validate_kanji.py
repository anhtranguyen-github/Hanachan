import json
import os

def validate_kanji_data(file_path):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    stats = {
        'total_records': 0,
        'missing_url': 0,
        'missing_character': 0,
        'missing_level': 0,
        'missing_meanings': 0,
        'empty_meanings_primary': 0,
        'empty_meanings_mnemonic': 0,
        'empty_meanings_hint': 0,
        'missing_readings': 0,
        'empty_readings_all': 0,
        'empty_readings_mnemonic': 0,
        'empty_readings_hint': 0,
        'missing_radicals': 0,
        'empty_radicals': 0,
        'missing_visually_similar': 0,
        'empty_visually_similar': 0,
        'missing_amalgamations': 0,
        'empty_amalgamations': 0,
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

            # Core fields
            if not data.get('url'):
                stats['missing_url'] += 1
            if not data.get('character'):
                stats['missing_character'] += 1
            if not data.get('level'):
                stats['missing_level'] += 1
            
            # Meanings
            meanings = data.get('meanings', {})
            if not meanings:
                stats['missing_meanings'] += 1
            else:
                if not meanings.get('primary'):
                    stats['empty_meanings_primary'] += 1
                if not meanings.get('mnemonic'):
                    stats['empty_meanings_mnemonic'] += 1
                if not meanings.get('hint'):
                    stats['empty_meanings_hint'] += 1

            # Readings
            readings = data.get('readings', {})
            if not readings:
                stats['missing_readings'] += 1
            else:
                if not readings.get('onyomi') and not readings.get('kunyomi') and not readings.get('nanori'):
                    stats['empty_readings_all'] += 1
                if not readings.get('mnemonic'):
                    stats['empty_readings_mnemonic'] += 1
                if not readings.get('hint'):
                    stats['empty_readings_hint'] += 1

            # Radicals
            if 'radicals' not in data:
                stats['missing_radicals'] += 1
            elif not data['radicals']:
                stats['empty_radicals'] += 1

            # Visually Similar
            if 'visually_similar' not in data:
                stats['missing_visually_similar'] += 1
            elif not data['visually_similar']:
                stats['empty_visually_similar'] += 1

            # Amalgamations
            if 'amalgamations' not in data:
                stats['missing_amalgamations'] += 1
            elif not data['amalgamations']:
                stats['empty_amalgamations'] += 1

    print("\n--- Validation Results ---")
    for key, val in stats.items():
        percentage = (val / stats['total_records'] * 100) if stats['total_records'] > 0 else 0
        print(f"{key:30}: {val:5} ({percentage:6.2f}%)")
    
    if stats['total_records'] > 0:
        # Check if there are critical missing fields (some fields like hint might genuinely be empty for some)
        serious_issues = [
            'missing_url', 'missing_character', 'missing_level', 'missing_meanings',
            'empty_meanings_primary', 'empty_meanings_mnemonic',
            'missing_readings', 'empty_readings_all', 'empty_readings_mnemonic',
            'missing_radicals', 'empty_radicals', # Kanji usually have radicals
            'missing_visually_similar', # Field should exist
            'missing_amalgamations', # Field should exist
        ]
        has_issues = any(stats[key] > 0 for key in serious_issues)
        print("\nConclusion: " + ("Issues found!" if has_issues else "Data looks healthy."))

if __name__ == "__main__":
    path = "/home/tra01/project/hanachan_v2_final/data/kanji/kanji_full_data.jsonl"
    validate_kanji_data(path)
