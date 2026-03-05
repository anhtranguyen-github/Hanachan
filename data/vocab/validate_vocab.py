import json
import os

def contains_kanji(text):
    # Basic Kanji range: 4E00-9FAF
    return any('\u4e00' <= char <= '\u9faf' for char in text)

def validate_vocab_data(file_path):
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
        'empty_meanings_pos': 0,
        'empty_meanings_mnemonic': 0,
        'missing_readings': 0,
        'empty_readings_primary': 0,
        'empty_readings_mnemonic': 0,
        'missing_audio': 0,
        'empty_audio': 0,
        'missing_context': 0,
        'empty_context': 0,
        'missing_components': 0,
        'empty_components': 0,
        'kana_only_words': 0
    }

    serious_error_count = 0

    print(f"Validating {file_path}...")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        for i, line in enumerate(f):
            stats['total_records'] += 1
            try:
                data = json.loads(line)
            except json.JSONDecodeError:
                print(f"Line {i+1}: Invalid JSON")
                continue

            char = data.get('character', '')
            has_kanji = contains_kanji(char)
            if not has_kanji:
                stats['kana_only_words'] += 1

            # Core fields
            if not data.get('url'): stats['missing_url'] += 1; serious_error_count += 1
            if not char: stats['missing_character'] += 1; serious_error_count += 1
            if not data.get('level'): stats['missing_level'] += 1; serious_error_count += 1
            
            # Meanings
            meanings = data.get('meanings', {})
            if not meanings:
                stats['missing_meanings'] += 1
                serious_error_count += 1
            else:
                if not meanings.get('primary'): stats['empty_meanings_primary'] += 1; serious_error_count += 1
                if not meanings.get('mnemonic'): stats['empty_meanings_mnemonic'] += 1; serious_error_count += 1

            # Readings
            readings = data.get('readings', {})
            if not readings:
                stats['missing_readings'] += 1
                serious_error_count += 1
            else:
                if not readings.get('primary'): stats['empty_readings_primary'] += 1; serious_error_count += 1
                
                # Mnemonic is only "serious" if it has Kanji and the reading isn't just the character
                if not readings.get('mnemonic'):
                    stats['empty_readings_mnemonic'] += 1
                    if has_kanji and char != readings.get('primary'):
                        serious_error_count += 1

            # Components
            if 'components' not in data:
                stats['missing_components'] += 1
                serious_error_count += 1
            elif not data.get('components'):
                stats['empty_components'] += 1
                if has_kanji:
                    serious_error_count += 1

    print("\n--- Vocabulary Validation Results ---")
    if stats['total_records'] == 0:
        print("No records found to validate.")
        return

    for key, val in stats.items():
        percentage = (val / stats['total_records'] * 100)
        print(f"{key:30}: {val:5} ({percentage:6.2f}%)")
    
    print(f"\nSerious Errors Found: {serious_error_count}")
    print(f"Kana-only Words (no kanji): {stats['kana_only_words']}")
    
    print("\nConclusion: " + ("Issues found in critical fields!" if serious_error_count > 0 else "Data looks healthy."))

if __name__ == "__main__":
    path = "/home/tra01/project/hanachan_v2_final/data/vocab/vocab_full_data.jsonl"
    validate_vocab_data(path)
